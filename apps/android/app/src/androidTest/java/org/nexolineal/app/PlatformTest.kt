package org.nexolineal.app

import android.content.Context
import android.net.ConnectivityManager
import android.os.SystemClock
import android.os.Build
import com.chaquo.python.Python
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class PlatformTest {
    private lateinit var scenario: ActivityScenario<MainActivity>

    private fun js(script: String): String {
        var value = "null"
        val latch = CountDownLatch(1)
        scenario.onActivity { activity ->
            activity.bridge.webView.evaluateJavascript(script) { result ->
                value = result ?: "null"
                latch.countDown()
            }
        }
        check(latch.await(20, TimeUnit.SECONDS)) { "La interfaz no respondió." }
        return value
    }

    private fun waitFor(script: String, seconds: Int = 120): String {
        val deadline = SystemClock.elapsedRealtime() + seconds * 1000
        while (SystemClock.elapsedRealtime() < deadline) {
            val value = js(script)
            if (value != "null" && value != "false" && value != "\"\"") return value
            SystemClock.sleep(100)
        }
        throw AssertionError("Tiempo agotado esperando $script")
    }

    private fun canonical(value: Any?): Any? = when (value) {
        null, JSONObject.NULL -> null
        is JSONObject -> value.keys().asSequence().sorted().associateWith { canonical(value.get(it)) }
        is JSONArray -> (0 until value.length()).map { canonical(value.get(it)) }
        else -> value
    }

    @Test
    fun offlineUiContractsCancellationAndRecovery() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val network = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        // Android Test Platform puede reactivar Wi-Fi durante la instalación.
        // Se desconecta desde la instrumentación, antes de abrir la aplicación.
        for (command in listOf("cmd connectivity airplane-mode enable", "svc wifi disable", "svc data disable")) {
            android.os.ParcelFileDescriptor.AutoCloseInputStream(instrumentation.uiAutomation.executeShellCommand(command)).bufferedReader().use { it.readText() }
        }
        val disconnectDeadline = SystemClock.elapsedRealtime() + 15000
        while (network.activeNetwork != null && SystemClock.elapsedRealtime() < disconnectDeadline) SystemClock.sleep(100)
        assertNull("La prueba debe iniciar sin red: " + network.getNetworkCapabilities(network.activeNetwork), network.activeNetwork)
        val report = JSONObject().put("approved", false).put("offline", true)
            .put("api", Build.VERSION.SDK_INT).put("abis", JSONArray(Build.SUPPORTED_ABIS.toList()))
        val cases = JSONArray()
        scenario = ActivityScenario.launch(MainActivity::class.java)
        try {
            waitFor("document.querySelector('#calcular') && !document.querySelector('#calcular').disabled")
            report.put("python", Python.getInstance().getModule("sys").get("version").toString())
            js("document.querySelector('#calcular').click()")
            waitFor("document.querySelector('#resultado').dataset.status === 'ok'")
            val text = JSONArray("[" + js("document.querySelector('#resultado').innerText") + "]").getString(0)
            assertTrue(text.contains("7"))
            js("document.querySelector('#modo-explorador').click()")
            assertEquals("\"explorador\"", js("document.querySelector('.app').dataset.mode"))
            cases.put(JSONObject().put("name", "interfaz offline y cambio de presentación").put("passed", true))

            // Además de los contratos directos se prueba la entrada real del usuario.
            js("(()=>{const e=document.querySelector('#operacion');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'sistemas.resolver');e.dispatchEvent(new Event('change',{bubbles:true}));})();")
            waitFor("!!document.querySelector('#dato-b')")
            js("for(const [id,value] of [['matriz-a','1 2 3;2 4 6'],['dato-b','1 2']]){const e=document.getElementById(id);const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}")
            js("document.querySelector('#calcular').click()")
            waitFor("document.querySelector('#resultado').dataset.status === 'infinite'")
            js("document.querySelector('#modo-serio').click()")
            assertEquals("\"infinite\"", js("document.querySelector('#resultado').dataset.status"))
            assertEquals("\"1 2 3;2 4 6\"", js("document.querySelector('#matriz-a').value"))
            cases.put(JSONObject().put("name", "sistema rectangular desde formulario en ambos modos").put("passed", true))

            js("(()=>{const e=document.querySelector('#operacion');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'raices.biseccion');e.dispatchEvent(new Event('change',{bubbles:true}));})();")
            waitFor("!!document.querySelector('#dato-tolerancia_x')")
            js("document.querySelector('#calcular').click()")
            waitFor("document.querySelector('#resultado').dataset.status === 'ok'")
            assertEquals("true", js("!!document.querySelector('.iteration-table table')"))
            js("document.querySelector('#modo-explorador').click()")
            assertEquals("\"ok\"", js("document.querySelector('#resultado').dataset.status"))
            cases.put(JSONObject().put("name", "bisección desde formulario nativo con tabla y cambio de modo").put("passed", true))

            val fixtures = JSONArray(instrumentation.context.assets.open("platform-cases.json").bufferedReader().use { it.readText() })
            for (i in 0 until fixtures.length()) {
                val test = fixtures.getJSONObject(i)
                val request = test.getJSONObject("request")
                val id = "fixture-$i"
                js("window.__ciResult=null;window.__ciError=null;void(async()=>{try{const e=Capacitor.Plugins.NexoEngine;await e.prepare({requestId:'$id'});window.__ciResult=(await e.execute({requestId:'$id',problem:$request})).response;}catch(e){window.__ciError=String(e);}})();")
                val result = waitFor("window.__ciResult || window.__ciError")
                check(result.startsWith("{")) { result }
                assertEquals(canonical(test.getJSONObject("expected")), canonical(JSONObject(result)))
                cases.put(JSONObject().put("name", request.getString("operation_id")).put("response", JSONObject(result)).put("passed", true))
            }

            val small = "{\"schema_version\":\"1.0\",\"operation_id\":\"matrices.producto\",\"input\":{\"A\":[[\"2\"]],\"B\":[[\"3\"]]}}"
            js("void(async()=>{const e=Capacitor.Plugins.NexoEngine;await e.prepare({requestId:'cancel'});await e.cancel({requestId:'cancel'});window.__ciCancel=(await e.execute({requestId:'cancel',problem:$small})).response;})();")
            val cancelled = JSONObject(waitFor("window.__ciCancel"))
            assertEquals("cancelled", cancelled.getString("status"))
            js("void(async()=>{const e=Capacitor.Plugins.NexoEngine;await e.prepare({requestId:'recovery'});window.__ciRecovery=(await e.execute({requestId:'recovery',problem:$small})).response;})();")
            val recovered = JSONObject(waitFor("window.__ciRecovery"))
            assertEquals("6", recovered.getJSONObject("result").getJSONArray("matrix").getJSONArray(0).getString(0))
            cases.put(JSONObject().put("name", "cancelación y recuperación").put("passed", true))
            report.put("approved", true)
            UiDevice.getInstance(instrumentation).takeScreenshot(File(context.filesDir, "fase03-android.png"))
        } finally {
            report.put("cases", cases)
            File(context.filesDir, "fase03-android.json").writeText(report.toString(2))
            println("NEXO_ANDROID_REPORT=" + report)
            scenario.close()
        }
    }
}
