package org.nexolineal.app
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(NexoEnginePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
