/** IndexedDB confirma una transacción antes de anunciar guardado. El JSON previo no se borra. */
const DB = "nexolineal.workspace";
const STORE = "projects";
const ACTIVE = "active";
const LEGACY = "nexolineal.project.v1";
let opening: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => {
      opening = undefined;
      reject(request.error || new Error("No se pudo abrir el guardado local."));
    };
    request.onblocked = () => {
      opening = undefined;
      reject(
        new Error(
          "Otra pestaña impide actualizar el guardado. Cerrá las otras pestañas de NexoLineal.",
        ),
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        opening = undefined;
      };
      resolve(db);
    };
  });
  return opening;
}
function transaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let value: T;
    const request = action(tx.objectStore(STORE));
    request.onsuccess = () => (value = request.result);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () =>
      reject(
        tx.error ||
          request.error ||
          new Error("No se pudo guardar el proyecto."),
      );
    tx.onabort = () => reject(tx.error || new Error("Se canceló el guardado."));
  });
}
export async function loadWebState(): Promise<string | null> {
  const db = await open();
  const raw = await transaction(db, "readonly", (store) => store.get(ACTIVE));
  if (raw !== undefined) {
    if (typeof raw !== "string")
      throw new Error("Guardado local incompatible.");
    return raw;
  }
  const legacy = localStorage.getItem(LEGACY);
  if (legacy === null) return null;
  const p = JSON.parse(legacy);
  if (
    p?.format !== "NexoLineal.Project" ||
    p.version !== 1 ||
    new TextEncoder().encode(legacy).length > 2 * 1024 * 1024
  )
    throw new Error(
      "El guardado anterior es incompatible; no se sobrescribió.",
    );
  await transaction(db, "readwrite", (store) => store.put(legacy, ACTIVE));
  return legacy;
}
export async function saveWebState(content: string): Promise<void> {
  const db = await open();
  await transaction(db, "readwrite", (store) => store.put(content, ACTIVE));
}
