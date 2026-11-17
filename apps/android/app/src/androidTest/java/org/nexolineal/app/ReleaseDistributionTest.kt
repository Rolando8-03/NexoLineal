package org.nexolineal.app

import android.content.Context
import android.net.ConnectivityManager
import android.os.Bundle
import android.os.SystemClock
import android.os.Debug
import android.content.pm.ApplicationInfo
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Release real no depurable; la instrumentación está en otro APK con la misma firma. */
@RunWith(AndroidJUnit4::class)
class ReleaseDistributionTest {
 private lateinit var scenario: ActivityScenario<MainActivity>
 private fun js(code: String): String {
  var value="null";val latch=CountDownLatch(1)
  scenario.onActivity { it.bridge.webView.evaluateJavascript(code) { result -> value=result?:"null";latch.countDown() } }
  check(latch.await(20,TimeUnit.SECONDS));return value
 }
 private fun waitFor(code: String) {
  val deadline=SystemClock.elapsedRealtime()+120000
  while(SystemClock.elapsedRealtime()<deadline){val v=js(code);if(v!="null"&&v!="false"&&v!="\"\"")return;SystemClock.sleep(100)}
  error("Tiempo agotado: $code; "+js("document.body.innerText.slice(-3000)"))
 }
 @Test fun releaseOfflineKeyboardBackAndReopen() {
  val instrumentation=InstrumentationRegistry.getInstrumentation();val context=instrumentation.targetContext
  assertEquals(0,context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE)
  for(command in listOf("cmd connectivity airplane-mode enable","svc wifi disable","svc data disable"))android.os.ParcelFileDescriptor.AutoCloseInputStream(instrumentation.uiAutomation.executeShellCommand(command)).bufferedReader().use{it.readText()}
  val network=context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
  val deadline=SystemClock.elapsedRealtime()+15000
  while(network.activeNetwork!=null&&SystemClock.elapsedRealtime()<deadline)SystemClock.sleep(100)
  assertNull(network.activeNetwork)
  val portable=instrumentation.context.assets.open("fase08-project.json").bufferedReader().use { it.readText() }
  val migration=java.io.File(context.filesDir,"workspace-v1.json");migration.writeText(portable)
  val began=SystemClock.elapsedRealtime();scenario=ActivityScenario.launch(MainActivity::class.java)
  try {
   waitFor("document.querySelector('#calcular')&&!document.querySelector('#calcular').disabled")
   waitFor("document.querySelector('#resultado').dataset.status==='ok'")
   assertTrue(js("document.querySelector('#resultado').innerText").contains("7"))
   assertEquals(portable,migration.readText())
   val startup=SystemClock.elapsedRealtime()-began
   val calc=SystemClock.elapsedRealtime();js("document.querySelector('#calcular').click()")
   waitFor("document.querySelector('#resultado').dataset.status==='ok'")
   val calculate=SystemClock.elapsedRealtime()-calc
   js("document.querySelector('#matriz-a').focus()")
   scenario.onActivity { val imm=context.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager;imm.showSoftInput(it.bridge.webView,android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT) }
   val device=UiDevice.getInstance(instrumentation);device.pressBack()
   // La tecla Atrás de la actividad vuelve al inicio y conserva el proyecto.
   js("document.querySelector('nav button[data-route=historial]').click()")
   waitFor("document.querySelector('nav button[data-route=historial]').getAttribute('aria-current')==='page'")
   device.pressBack()
   waitFor("document.querySelector('nav button[data-route=inicio]').getAttribute('aria-current')==='page'")
   device.pressHome();SystemClock.sleep(500)
   scenario.close();scenario=ActivityScenario.launch(MainActivity::class.java)
   waitFor("document.querySelector('#calcular')&&!document.querySelector('#calcular').disabled")
   val store=ProjectDatabase(context);val raw=store.load();assertNotNull(raw);assertTrue(JSONObject(raw!!).getJSONArray("history").length()>0);store.close()
   scenario.recreate();waitFor("document.querySelector('#calcular')&&!document.querySelector('#calcular').disabled")
   val report=JSONObject().put("approved",true).put("debuggable",false).put("offline",true).put("physical_phone",false).put("model",android.os.Build.MODEL).put("api",android.os.Build.VERSION.SDK_INT).put("startup_ms",startup).put("calculation_ms",calculate).put("total_pss_kib",Debug.getPss()).put("reopen",true).put("activity_recreation",true).put("keyboard_back_exercised",true).put("keyboard_visibility_asserted",false).put("cross_project_sha256",java.security.MessageDigest.getInstance("SHA-256").digest(portable.toByteArray()).joinToString("") { "%02x".format(it) }).put("cross_project_recalculated",true)
   instrumentation.sendStatus(0,Bundle().apply{putString("nexo_distribution",report.toString())})
  }finally{scenario.close()}
 }
}
