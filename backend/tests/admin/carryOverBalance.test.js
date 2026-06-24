import { describe, expect, it } from "vitest";
import { applyCarryOver } from "../../routes/admin/payments/carryOverBalance.js";

describe("applyCarryOver — arrastre de saldo negativo", () => {
  it("arrastra un negativo y lo convierte en positivo al acumularse", () => {
    const input = [
      { forMonth: "2026-01", amount: -500 },
      { forMonth: "2026-02", amount: 300 },
      { forMonth: "2026-03", amount: 700 },
    ];
    const res = applyCarryOver(input);
    const byMonth = Object.fromEntries(res.map((m) => [m.forMonth, m]));

    // Mes 1: -500 -> muestra -500, paga 0
    expect(byMonth["2026-01"].displayAmount).toBe(-500);
    expect(byMonth["2026-01"].payableAmount).toBe(0);

    // Mes 2: -500 + 300 = -200 -> muestra -200, paga 0
    expect(byMonth["2026-02"].displayAmount).toBe(-200);
    expect(byMonth["2026-02"].payableAmount).toBe(0);

    // Mes 3: -200 + 700 = +500 -> muestra 500, paga 500
    expect(byMonth["2026-03"].displayAmount).toBe(500);
    expect(byMonth["2026-03"].payableAmount).toBe(500);
  });

  it("un mes positivo normal se paga completo sin arrastre previo", () => {
    const res = applyCarryOver([{ forMonth: "2026-05", amount: 1000 }]);
    expect(res[0].displayAmount).toBe(1000);
    expect(res[0].payableAmount).toBe(1000);
  });

  it("un mes ya pagado resetea el acumulado", () => {
    const input = [
      { forMonth: "2026-01", amount: -400 },     // arrastra -400
      { forMonth: "2026-02", amount: 1000, status: "paid" }, // pagado: resetea
      { forMonth: "2026-03", amount: -100 },     // empieza de cero -> -100
    ];
    const res = applyCarryOver(input);
    const byMonth = Object.fromEntries(res.map((m) => [m.forMonth, m]));

    expect(byMonth["2026-02"].payableAmount).toBe(1000); // pagado intacto
    // El -400 NO se arrastra más allá del mes pagado
    expect(byMonth["2026-03"].displayAmount).toBe(-100);
    expect(byMonth["2026-03"].payableAmount).toBe(0);
  });

  it("preserva el orden de entrada", () => {
    const input = [
      { forMonth: "2026-03", amount: 700 },
      { forMonth: "2026-01", amount: -500 },
      { forMonth: "2026-02", amount: 300 },
    ];
    const res = applyCarryOver(input);
    expect(res.map((m) => m.forMonth)).toEqual(["2026-03", "2026-01", "2026-02"]);
  });

  it("maneja centavos sin errores de coma flotante", () => {
    const input = [
      { forMonth: "2026-01", amount: -0.1 },
      { forMonth: "2026-02", amount: -0.2 },
    ];
    const res = applyCarryOver(input);
    const byMonth = Object.fromEntries(res.map((m) => [m.forMonth, m]));
    expect(byMonth["2026-02"].displayAmount).toBe(-0.3); // no -0.30000000000000004
  });
});
