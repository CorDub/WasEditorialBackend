/**
 * Arrastre de saldo negativo entre meses (cuenta corriente del autor).
 *
 * Regla de negocio:
 * - Cada mes tiene un balance crudo (ventas + kindle - costos).
 * - Se lleva un acumulado en orden cronológico.
 * - Si el acumulado es negativo: el mes "muestra" ese negativo, pero el pago
 *   efectivo es 0, y el negativo se arrastra al mes siguiente.
 * - Si el acumulado es positivo: ese acumulado es lo que se paga.
 * - Un mes ya PAGADO (status "paid") cierra/resetea el acumulado a 0
 *   (ese dinero ya salió; no se recalcula).
 *
 * IMPORTANTE: el redondeo se hace en centavos para evitar errores de coma
 * flotante (consistente con utils.js — es dinero real de autores).
 *
 * @param {Array<{forMonth: string, status?: string, amount: number}>} months
 *   Meses con su balance crudo (amount). NO necesita venir ordenado.
 * @returns {Array} los mismos meses, en el MISMO orden de entrada, con:
 *   - rawAmount: el balance del mes por sí solo (lo que antes era "amount")
 *   - carriedIn: saldo que venía arrastrado del mes anterior
 *   - displayAmount: saldo acumulado a mostrar (puede ser negativo)
 *   - payableAmount: lo que efectivamente se paga ese mes (0 si negativo)
 */
export function applyCarryOver(months) {
  // Ordenar cronológicamente por forMonth ("YYYY-MM" se ordena como string)
  const chronological = [...months].sort((a, b) =>
    a.forMonth.localeCompare(b.forMonth)
  );

  let carryCents = 0; // acumulado arrastrado, en centavos

  const byMonth = new Map();
  for (const m of chronological) {
    const rawCents = Math.round((m.amount ?? 0) * 100);

    if (m.status === "paid") {
      // El mes ya se pagó: ese dinero ya salió. El acumulado se cierra.
      byMonth.set(m.forMonth, {
        ...m,
        rawAmount: rawCents / 100,
        carriedIn: 0,
        displayAmount: rawCents / 100,
        payableAmount: rawCents / 100,
      });
      carryCents = 0;
      continue;
    }

    const carriedInCents = carryCents;
    const accumulatedCents = carriedInCents + rawCents;

    if (accumulatedCents < 0) {
      // Sigue en negativo: se muestra el negativo, se paga 0, se arrastra.
      byMonth.set(m.forMonth, {
        ...m,
        rawAmount: rawCents / 100,
        carriedIn: carriedInCents / 100,
        displayAmount: accumulatedCents / 100,
        payableAmount: 0,
      });
      carryCents = accumulatedCents;
    } else {
      // Acumulado positivo (o cero): se paga el acumulado, se resetea.
      byMonth.set(m.forMonth, {
        ...m,
        rawAmount: rawCents / 100,
        carriedIn: carriedInCents / 100,
        displayAmount: accumulatedCents / 100,
        payableAmount: accumulatedCents / 100,
      });
      carryCents = 0;
    }
  }

  // Devolver en el orden original de entrada
  return months.map((m) => byMonth.get(m.forMonth));
}
