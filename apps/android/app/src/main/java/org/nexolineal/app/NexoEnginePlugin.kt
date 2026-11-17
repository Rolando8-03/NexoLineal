package org.nexolineal.app

import android.app.Activity
import android.content.Intent
import android.util.AtomicFile
import androidx.activity.result.ActivityResult
import com.getcapacitor.annotation.ActivityCallback
import java.io.FileNotFoundException
import java.io.File
import java.io.ByteArrayOutputStream
import org.json.JSONObject
import com.chaquo.python.Python
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.concurrent.Executors

@CapacitorPlugin(name = "NexoEngine")
class NexoEnginePlugin : Plugin() {
    private val executor = Executors.newSingleThreadExecutor()
    private fun engine() = Python.getInstance().getModule("nexolineal.platforms.jobs")
    private fun requestId(call: PluginCall): String =
        call.getString("requestId") ?: throw IllegalArgumentException("Falta el identificador del trabajo.")

    @PluginMethod
    fun prepare(call: PluginCall) {
        try {
            call.resolve(JSObject(engine().callAttr("prepare", requestId(call)).toString()))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo preparar el cálculo.") }
    }

    @PluginMethod
    fun execute(call: PluginCall) {
        try {
            val id = requestId(call)
            val problem = call.getObject("problem")?.toString()
                ?: throw IllegalArgumentException("Falta el problema.")
            executor.execute {
                try {
                    call.resolve(JSObject(engine().callAttr("run", id, problem).toString()))
                } catch (error: Exception) { call.reject(error.message ?: "No se pudo completar el cálculo.") }
            }
        } catch (error: Exception) { call.reject(error.message ?: "Solicitud inválida.") }
    }

    @PluginMethod
    fun cancel(call: PluginCall) {
        try {
            call.resolve(JSObject(engine().callAttr("cancel", requestId(call)).toString()))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo cancelar.") }
    }

    @PluginMethod
    fun progress(call: PluginCall) {
        try {
            call.resolve(JSObject(engine().callAttr("progress", requestId(call)).toString()))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo consultar el progreso.") }
    }

    private val maxProjectBytes = 2 * 1024 * 1024
    private fun checked(content: String): String {
        require(content.toByteArray(Charsets.UTF_8).size <= maxProjectBytes) { "El proyecto supera 2 MiB." }
        val data = JSONObject(content)
        require(data.optString("format") == "NexoLineal.Project" && data.optInt("version") == 1) { "Formato de proyecto incompatible." }
        return content
    }

    @PluginMethod
    fun load_state(call: PluginCall) {
        try {
            val file = AtomicFile(File(context.filesDir, "workspace-v1.json"))
            val content = try { checked(String(file.readFully(), Charsets.UTF_8)) } catch (error: FileNotFoundException) { null }
            call.resolve(JSObject().put("content", content ?: JSONObject.NULL))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo recuperar el proyecto.") }
    }

    @PluginMethod
    fun save_state(call: PluginCall) {
        try {
            val content = checked(call.getString("content") ?: error("Falta el proyecto."))
            val file = AtomicFile(File(context.filesDir, "workspace-v1.json"))
            val stream = file.startWrite()
            try { stream.write(content.toByteArray(Charsets.UTF_8)); file.finishWrite(stream) }
            catch (error: Exception) { file.failWrite(stream); throw error }
            call.resolve(JSObject().put("saved", true))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo guardar el proyecto.") }
    }

    @PluginMethod
    fun export_project(call: PluginCall) {
        try {
            checked(call.getString("content") ?: error("Falta el proyecto."))
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                .setType("application/json").putExtra(Intent.EXTRA_TITLE, "NexoLineal-proyecto.json")
            startActivityForResult(call, intent, "exportReady")
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo abrir el selector de archivos.") }
    }

    @ActivityCallback
    private fun exportReady(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        try {
            val uri = result.data?.data
            if (result.resultCode != Activity.RESULT_OK || uri == null) { call.resolve(JSObject().put("cancelled", true)); return }
            val content = checked(call.getString("content") ?: error("Falta el proyecto."))
            context.contentResolver.openOutputStream(uri)?.use { it.write(content.toByteArray(Charsets.UTF_8)) }
                ?: error("No se pudo escribir el archivo elegido.")
            call.resolve(JSObject().put("cancelled", false))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo exportar el proyecto.") }
    }

    @PluginMethod
    fun import_project(call: PluginCall) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json")
        startActivityForResult(call, intent, "importReady")
    }

    @ActivityCallback
    private fun importReady(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        try {
            val uri = result.data?.data
            if (result.resultCode != Activity.RESULT_OK || uri == null) { call.resolve(JSObject().put("cancelled", true)); return }
            val output = ByteArrayOutputStream()
            context.contentResolver.openInputStream(uri)?.use { input ->
                val buffer = ByteArray(8192)
                while (true) { val count = input.read(buffer); if (count < 0) break
                    require(output.size() + count <= maxProjectBytes) { "El archivo supera 2 MiB." }
                    output.write(buffer, 0, count)
                }
            } ?: error("No se pudo leer el archivo elegido.")
            call.resolve(JSObject().put("cancelled", false).put("content", checked(output.toString("UTF-8"))))
        } catch (error: Exception) { call.reject(error.message ?: "No se pudo importar el proyecto.") }
    }

    override fun handleOnDestroy() {
        engine().callAttr("cancel_all")
        executor.shutdownNow()
        super.handleOnDestroy()
    }
}
