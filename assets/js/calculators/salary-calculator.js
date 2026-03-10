/**
 * salary-calculator.js
 * mycalcu.in — Salary In-Hand Calculator
 *
 * Inputs:  #ctc (annual CTC in ₹)
 *          #basic-pct (range: % of CTC that is basic salary)
 *          input[name="regime"] (radio: "new" | "old")
 *          #metro (select: "metro" | "non-metro")
 *
 * Outputs: #result-primary    — Monthly in-hand salary
 *          #result-breakdown  — Row-by-row deduction table
 *          #result-box        — Gets class "visible"
 *
 * Tax slabs: FY 2025-26 (AY 2026-27) — Budget 2025 revised
 * Key changes vs FY 2024-25:
 *   - New regime slabs revised (basic exemption ₹4L, 30% slab starts at ₹24L)
 *   - Section 87A rebate increased to ₹60,000 (limit: ₹12L under new regime)
 *   - Standard deduction new regime: ₹75,000
 */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var EPF_RATE          = 0.12;     // Employee EPF: 12% of basic
  var EMPLOYER_EPF_RATE = 0.12;     // Employer EPF: excluded from take-home
  var GRATUITY_RATE     = 0.0481;   // 4.81% of basic (15/26 × 1/12 × basic)
  var STD_DEDUCTION_NEW = 75000;    // Standard deduction FY 2025-26 (new regime)
  var STD_DEDUCTION_OLD = 50000;    // Standard deduction FY 2025-26 (old regime)

  // Professional tax — Maharashtra model (most common)
  // Note: PT varies by state. Delhi/Haryana = ₹0. Karnataka Feb = ₹300.
  // Most states with PT charge ₹200/month. February may show ₹300 in
  // Karnataka to adjust for the annual ₹2,500 cap.
  var PT_METRO     = 200;
  var PT_NON_METRO = 200;  // Updated: most PT-levying states charge ₹200

  // ── New Tax Regime Slabs — FY 2025-26 (Budget 2025 revised) ───────────────
  // Basic exemption: ₹4 lakh (up from ₹3L)
  // 30% slab now starts at ₹24L (up from ₹15L)
  var NEW_SLABS = [
    { upto: 400000,   rate: 0.00 },
    { upto: 800000,   rate: 0.05 },
    { upto: 1200000,  rate: 0.10 },
    { upto: 1600000,  rate: 0.15 },
    { upto: 2000000,  rate: 0.20 },
    { upto: 2400000,  rate: 0.25 },
    { upto: Infinity, rate: 0.30 }
  ];

  // ── Old Tax Regime Slabs — FY 2025-26 (unchanged) ─────────────────────────
  var OLD_SLABS = [
    { upto: 250000,   rate: 0.00 },
    { upto: 500000,   rate: 0.05 },
    { upto: 1000000,  rate: 0.20 },
    { upto: Infinity, rate: 0.30 }
  ];

  // ── Section 87A Rebate — FY 2025-26 ───────────────────────────────────────
  // New regime: rebate up to ₹60,000 if taxable income ≤ ₹12L
  // Old regime: rebate up to ₹12,500 if taxable income ≤ ₹5L
  var REBATE_NEW_LIMIT  = 1200000;  // ₹12 lakh (up from ₹7L in FY 2024-25)
  var REBATE_NEW_MAX    = 60000;    // Max rebate under new regime
  var REBATE_OLD_LIMIT  = 500000;   // ₹5 lakh (unchanged)
  var REBATE_OLD_MAX    = 12500;    // Max rebate under old regime

  var HEALTH_ED_CESS    = 0.04;     // 4% cess on income tax

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatINR(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }

  function calcTaxOnSlabs(taxableIncome, slabs) {
    var tax = 0;
    var prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      var slab = slabs[i];
      if (taxableIncome <= prev) break;
      var slice = Math.min(taxableIncome, slab.upto) - prev;
      tax += slice * slab.rate;
      prev = slab.upto;
    }
    return tax;
  }

  function calcAnnualTax(grossAnnual, basicAnnual, regime) {
    var stdDeduction = (regime === 'new') ? STD_DEDUCTION_NEW : STD_DEDUCTION_OLD;
    var taxableIncome = grossAnnual - stdDeduction;

    // Old regime: 80C deduction
    if (regime === 'old') {
      var epfContrib = basicAnnual * EPF_RATE;
      var deduction80C = Math.min(150000, epfContrib + 50000);
      taxableIncome -= deduction80C;
    }

    taxableIncome = Math.max(0, taxableIncome);

    var slabs = (regime === 'new') ? NEW_SLABS : OLD_SLABS;
    var tax = calcTaxOnSlabs(taxableIncome, slabs);

    // Section 87A Rebate
    if (regime === 'new' && taxableIncome <= REBATE_NEW_LIMIT) {
      // Full rebate if tax ≤ ₹60,000, else partial (marginal relief handled by capping)
      tax = Math.max(0, tax - Math.min(tax, REBATE_NEW_MAX));
    } else if (regime === 'old' && taxableIncome <= REBATE_OLD_LIMIT) {
      tax = Math.max(0, tax - Math.min(tax, REBATE_OLD_MAX));
    }

    // Marginal relief: if taxable income just above ₹12L (new) or ₹5L (old),
    // tax should not exceed income above the rebate threshold
    if (regime === 'new' && taxableIncome > REBATE_NEW_LIMIT) {
      var excessIncome = taxableIncome - REBATE_NEW_LIMIT;
      if (tax > excessIncome) {
        tax = excessIncome; // marginal relief
      }
    }

    // Add 4% health & education cess
    tax = tax + (tax * HEALTH_ED_CESS);

    return Math.max(0, tax);
  }

  // ── Core calculation ───────────────────────────────────────────────────────
  function calculate() {
    var ctc       = parseFloat(document.getElementById('ctc').value) || 0;
    var basicPct  = parseFloat(document.getElementById('basic-pct').value) / 100;
    var regime    = document.querySelector('input[name="regime"]:checked').value;
    var cityType  = document.getElementById('metro').value;

    if (ctc <= 0) return;

    var basicAnnual    = ctc * basicPct;
    var employerEPF    = basicAnnual * EMPLOYER_EPF_RATE;
    var gratuity       = basicAnnual * GRATUITY_RATE;
    var grossAnnual    = ctc - employerEPF - gratuity;
    var empEPFAnnual   = basicAnnual * EPF_RATE;

    var annualTax = calcAnnualTax(grossAnnual, basicAnnual, regime);

    var grossMonthly   = grossAnnual / 12;
    var empEPFMonthly  = empEPFAnnual / 12;
    var ptMonthly      = (cityType === 'metro') ? PT_METRO : PT_NON_METRO;
    var taxMonthly     = annualTax / 12;
    var inHandMonthly  = grossMonthly - empEPFMonthly - ptMonthly - taxMonthly;
    var inHandAnnual   = inHandMonthly * 12;

    // PT note for display
    var ptNote = cityType === 'non-metro'
      ? ' (varies by state; ₹0 in Delhi/Haryana)'
      : ' (Maharashtra/Karnataka; Feb may show ₹300)';

    document.getElementById('result-primary').textContent = formatINR(inHandMonthly) + '/month';

    var rows = [
      { label: 'Gross Monthly Salary',        val: formatINR(grossMonthly),               cls: '' },
      { label: 'Employee EPF (12% of basic)', val: '− ' + formatINR(empEPFMonthly),       cls: '' },
      { label: 'Professional Tax' + ptNote,   val: '− ' + formatINR(ptMonthly),           cls: '' },
      { label: 'Income Tax / TDS',            val: '− ' + formatINR(taxMonthly),          cls: '' },
      { label: 'Monthly In-Hand',             val: formatINR(inHandMonthly),              cls: 'highlight' },
      { label: 'Annual In-Hand',              val: formatINR(inHandAnnual),               cls: 'highlight' },
    ];

    renderBreakdown(rows);

    var box = document.getElementById('result-box');
    box.classList.add('visible');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderBreakdown(rows) {
    var container = document.getElementById('result-breakdown');
    container.innerHTML = rows.map(function (r) {
      return '<div class="result-row">' +
        '<span class="result-row__label">' + r.label + '</span>' +
        '<span class="result-row__val ' + r.cls + '">' + r.val + '</span>' +
        '</div>';
    }).join('');
  }

  function initSlider() {
    var slider = document.getElementById('basic-pct');
    var label  = document.getElementById('basic-pct-val');
    if (!slider || !label) return;
    slider.addEventListener('input', function () {
      label.textContent = this.value + '%';
    });
  }

  function init() {
    initSlider();
    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);
    document.querySelectorAll('#ctc, #basic-pct, #metro').forEach(function (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') calculate();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
