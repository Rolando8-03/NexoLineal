package org.nexolineal.app

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.content.ContentValues
import android.util.AtomicFile
import java.io.File
import java.io.FileNotFoundException
import org.json.JSONObject

/** Una fila guarda el documento portable completo; las magnitudes permanecen como texto. */
class ProjectDatabase(private val context: Context) : SQLiteOpenHelper(context,"workspace-v1.sqlite3",null,1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE workspace (id INTEGER PRIMARY KEY CHECK(id=1), content TEXT NOT NULL, updated_at INTEGER NOT NULL)")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        error("Versión de almacenamiento no admitida; se conserva la base existente.")
    }
    private fun checked(content: String): String {
        require(content.toByteArray(Charsets.UTF_8).size <= 2*1024*1024) { "El proyecto supera 2 MiB." }
        val p=JSONObject(content)
        require(p.optString("format")=="NexoLineal.Project"&&p.optInt("version")==1) { "Formato de proyecto incompatible." }
        return content
    }
    @Synchronized fun load(): String? {
        val db=writableDatabase
        db.rawQuery("SELECT content FROM workspace WHERE id=1",null).use { cursor ->
            if(cursor.moveToFirst())return checked(cursor.getString(0))
        }
        val legacy=try { String(AtomicFile(File(context.filesDir,"workspace-v1.json")).readFully(),Charsets.UTF_8) } catch (_: FileNotFoundException) { return null }
        checked(legacy)
        db.beginTransaction()
        try { val v=ContentValues().apply { put("id",1);put("content",legacy);put("updated_at",System.currentTimeMillis()) }
            db.insertWithOnConflict("workspace",null,v,SQLiteDatabase.CONFLICT_IGNORE);db.setTransactionSuccessful()
        } finally { db.endTransaction() }
        // No se elimina el JSON original, que sigue siendo una copia recuperable.
        return db.rawQuery("SELECT content FROM workspace WHERE id=1",null).use { it.moveToFirst();checked(it.getString(0)) }
    }
    @Synchronized fun save(content: String) {
        checked(content);val db=writableDatabase
        db.beginTransaction()
        try { val v=ContentValues().apply { put("id",1);put("content",content);put("updated_at",System.currentTimeMillis()) }
            db.insertWithOnConflict("workspace",null,v,SQLiteDatabase.CONFLICT_REPLACE);db.setTransactionSuccessful()
        } finally { db.endTransaction() }
    }
}
