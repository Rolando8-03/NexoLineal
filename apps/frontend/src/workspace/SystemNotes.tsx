export function SystemNotes() {
  return (
    <details className="related-theory system-notes">
      <summary>Cómo interpretar un sistema lineal</summary>
      <p>
        Cada fila de [A | b] representa una ecuación. Las columnas de A
        corresponden a las incógnitas y la última columna contiene los términos
        independientes. Aplicá cada operación de fila también a esa columna.
      </p>
      <h3>Qué te dicen los pivotes</h3>
      <p>
        En Gauss, eliminás las entradas debajo de cada pivote y resolvés desde
        la última ecuación hacia arriba. Gauss-Jordan lleva cada pivote a 1 y
        elimina también las entradas superiores de su columna.
      </p>
      <ul>
        <li>Si el rango de la aumentada supera al de A, alguna fila exige
          que cero sea igual a un número distinto de cero. El sistema es incompatible.</li>
        <li>Si ambos rangos coinciden y hay un pivote por incógnita, la solución es única.</li>
        <li>Si ambos rangos coinciden y alguna incógnita queda sin pivote,
          cada variable libre aporta un parámetro a la familia de soluciones.</li>
      </ul>
      <details>
        <summary>Ejemplo aplicado · Flujo de tránsito</summary>
        <p>
          Llegan 90 vehículos por hora a un cruce y se reparten entre dos
          calles, con flujos x y z. En el siguiente cruce, al flujo x se le
          suman otros 30 vehículos por hora y todos salen por la calle y.
          La conservación del flujo da x + z = 90 y −x + y = 30.
        </p>
        <p>Pegá estas dos filas con las columnas en el orden x, y, z, b.</p>
        <pre>{"1 0 1 90\n-1 1 0 30"}</pre>
        <p>
          Tomando z = t, obtenés (x, y, z) = (90, 120, 0) + t(−1, −1, 1).
          La particular cumple 90 + 0 = 90 y −90 + 120 = 30. La dirección
          aporta −1 + 1 = 0 y −(−1) + (−1) = 0. Así, sumar cualquier múltiplo
          de la dirección conserva las dos ecuaciones.
        </p>
        <p>
          Para que los tres flujos sigan los sentidos elegidos, el modelo de
          tránsito exige 0 ≤ t ≤ 90. Por ejemplo, t = 20 da (70, 100, 20)
          vehículos por hora.
        </p>
      </details>
      <details>
        <summary>Lecturas y material de clase</summary>
        <ul>
          <li>Grossman y Flores Godoy, <cite>Álgebra lineal</cite>, 7.ª ed.,
            §§ 1.2 y 1.4. Eliminación y sistemas homogéneos.</li>
          <li>David C. Lay, <cite>Álgebra lineal y sus aplicaciones</cite>,
            3.ª ed., §§ 1.2, 1.4–1.6. Pivotes, ecuación matricial, familias
            de soluciones y aplicaciones.</li>
          <li>David Poole, <cite>Álgebra lineal. Una introducción moderna</cite>,
            3.ª ed., § 2.2. Métodos directos para resolver sistemas.</li>
          <li>Chapra y Canale, <cite>Métodos numéricos para ingenieros</cite>,
            5.ª ed., §§ 9.2–9.3. Eliminación de Gauss y dificultades numéricas.</li>
          <li>G1, presentaciones <cite>Existencia y unicidad</cite> y
            <cite> Aplicaciones de sistemas lineales</cite>. G4, sesiones
            02–04 y 08. El ejemplo de tránsito adapta el principio de
            conservación de flujo con datos propios.</li>
        </ul>
      </details>
    </details>
  );
}
