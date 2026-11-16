"""Trabajos nativos identificados. La cancelación de un trabajo no afecta a otro."""
from dataclasses import dataclass, field
from threading import Event, Lock
import json
from ..application.service import execute

@dataclass
class Job:
    cancelled: Event = field(default_factory=Event)
    progress: int = 0
    running: bool = False

class JobPool:
    def __init__(self):
        self._lock = Lock()
        self._jobs = {}

    def prepare(self, request_id):
        if not isinstance(request_id, str) or not request_id or len(request_id) > 128:
            raise ValueError("Identificador de trabajo inválido.")
        with self._lock:
            if request_id in self._jobs:
                raise ValueError("El identificador ya está activo.")
            if len(self._jobs) >= 8:
                raise ValueError("Ya hay ocho trabajos preparados.")
            self._jobs[request_id] = Job()
        return {"ready": True}

    def run(self, request_id, problem):
        with self._lock:
            job = self._jobs.get(request_id)
            if job is None or job.running:
                raise ValueError("El trabajo no está preparado o ya se está ejecutando.")
            job.running = True
        def progress(value):
            with self._lock:
                job.progress = value
        try:
            return execute(problem, is_cancelled=job.cancelled.is_set, on_progress=progress)
        finally:
            with self._lock:
                self._jobs.pop(request_id, None)

    def cancel(self, request_id):
        with self._lock:
            job = self._jobs.get(request_id)
            if job is not None:
                job.cancelled.set()
        return {"cancelled": job is not None}

    def cancel_all(self):
        with self._lock:
            for job in self._jobs.values():
                job.cancelled.set()
            # Los trabajos en ejecución conservan su identificador hasta su finally.
            self._jobs = {key: job for key, job in self._jobs.items() if job.running}

    def progress(self, request_id):
        with self._lock:
            job = self._jobs.get(request_id)
            return {"progress": job.progress if job is not None else 100}

_pool = JobPool()

def prepare(request_id):
    return json.dumps(_pool.prepare(request_id), ensure_ascii=False)

def run(request_id, payload):
    return json.dumps({"response": _pool.run(request_id, json.loads(payload))}, ensure_ascii=False)

def cancel(request_id):
    return json.dumps(_pool.cancel(request_id), ensure_ascii=False)

def progress(request_id):
    return json.dumps(_pool.progress(request_id), ensure_ascii=False)

def cancel_all():
    _pool.cancel_all()
