package org.nexolineal.app

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

    override fun handleOnDestroy() {
        engine().callAttr("cancel_all")
        executor.shutdownNow()
        super.handleOnDestroy()
    }
}
