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
 * Tax slabs: FY 2024-25
 * All calculations are deterministic and fully explained in page content.
 */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var EPF_RATE          = 0.12;     // Employee EPF: 12% of basic
  var EMPLOYER_EPF_RATE = 0.12;     // Employer EPF: excluded from take-home
  var GRATUITY_RATE     = 0.0481;   // 4.81% of basic (15/26 × 1/12 × basic)
  var STD_DEDUCTION_NEW = 75000;    // Standard deduction FY 2024-25 (new regime)
  var STD_DEDUCTION_OLD = 50000;    // Standard deduction FY 2024-25 (old regime)

  // Professional tax (simplified — Maharashtra rates as default)
  var PT_METRO     = 200;  // ₹200/month for metro (Maharashtra model)
  var PT_NON_METRO = 150;  // ₹150/month approximate for non-metro states

  // New Tax Regime slabs FY 2024-25
  var NEW_SLABS = [
    { upto: 300000,   rate: 0.00 },
    { upto: 700000,   rate: 0.05 },
    { upto: 1000000,  rate: 0.10 },
    { upto: 1200000,  rate: 0.15 },
    { upto: 1500000,  rate: 0.20 },
    { upto: Infinity, rate: 0.30 }
  ];

  // Old Tax Regime slabs FY 2024-25
  var OLD_SLABS = [
    { upto: 250000,   rate: 0.00 },
    { upto: 500000,   rate: 0.05 },
    { upto: 1000000,  rate: 0.20 },
    { upto: Infinity, rate: 0.30 }
  ];

  // Rebate u/s 87A
  var REBATE_NEW_LIMIT  = 700000;   // Full rebate if taxable income ≤ ₹7L (new)
  var REBATE_OLD_LIMIT  = 500000;   // Full rebate if taxable income ≤ ₹5L (old)
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

    // Old regime: 80C deduction (assume max ₹1.5L via EPF + other)
    if (regime === 'old') {
      var epfContrib = basicAnnual * EPF_RATE;
      var deduction80C = Math.min(150000, epfContrib + 50000); // EPF + approx PPF/ELSS
      taxableIncome -= deduction80C;
    }

    taxableIncome = Math.max(0, taxableIncome);

    var slabs = (regime === 'new') ? NEW_SLABS : OLD_SLABS;
    var tax = calcTaxOnSlabs(taxableIncome, slabs);

    // Rebate 87A
    var rebateLimit = (regime === 'new') ? REBATE_NEW_LIMIT : REBATE_OLD_LIMIT;
    if (taxableIncome <= rebateLimit) {
      tax = 0;
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

    // Annual figures
    var basicAnnual    = ctc * basicPct;
    var employerEPF    = basicAnnual * EMPLOYER_EPF_RATE;
    var gratuity       = basicAnnual * GRATUITY_RATE;
    var grossAnnual    = ctc - employerEPF - gratuity;  // what employee actually earns
    var empEPFAnnual   = basicAnnual * EPF_RATE;

    // Income tax (annual)
    var annualTax = calcAnnualTax(grossAnnual, basicAnnual, regime);

    // Monthly figures
    var grossMonthly   = grossAnnual / 12;
    var empEPFMonthly  = empEPFAnnual / 12;
    var ptMonthly      = (cityType === 'metro') ? PT_METRO : PT_NON_METRO;
    var taxMonthly     = annualTax / 12;
    var inHandMonthly  = grossMonthly - empEPFMonthly - ptMonthly - taxMonthly;
    var inHandAnnual   = inHandMonthly * 12;

    // ── Render ─────────────────────────────────────────────────────────────
    document.getElementById('result-primary').textContent = formatINR(inHandMonthly) + '/month';

    var rows = [
      { label: 'Gross Monthly Salary',      val: formatINR(grossMonthly),  cls: '' },
      { label: 'Employee EPF (12% of basic)', val: '− ' + formatINR(empEPFMonthly), cls: '' },
      { label: 'Professional Tax',           val: '− ' + formatINR(ptMonthly),      cls: '' },
      { label: 'Income Tax (TDS)',            val: '− ' + formatINR(taxMonthly),     cls: '' },
      { label: 'Monthly In-Hand',            val: formatINR(inHandMonthly),          cls: 'highlight' },
      { label: 'Annual In-Hand',             val: formatINR(inHandAnnual),           cls: 'highlight' },
    ];

    renderBreakdown(rows);

    var box = document.getElementById('result-box');
    box.classList.add('visible');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Breakdown renderer ─────────────────────────────────────────────────────
  function renderBreakdown(rows) {
    var container = document.getElementById('result-breakdown');
    container.innerHTML = rows.map(function (r) {
      return '<div class="result-row">' +
        '<span class="result-row__label">' + r.label + '</span>' +
        '<span class="result-row__val ' + r.cls + '">' + r.val + '</span>' +
        '</div>';
    }).join('');
  }

  // ── Slider live label update ───────────────────────────────────────────────
  function initSlider() {
    var slider = document.getElementById('basic-pct');
    var label  = document.getElementById('basic-pct-val');
    if (!slider || !label) return;
    slider.addEventListener('input', function () {
      label.textContent = this.value + '%';
    });
  }

  // ── Event binding ──────────────────────────────────────────────────────────
  function init() {
    initSlider();
    var btn = document.getElementById('calc-btn');
    if (btn) {
      btn.addEventListener('click', calculate);
    }
    // Also calculate on Enter key inside inputs
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
