/**
 * tax-calculator.js — Income Tax Calculator FY 2025-26
 * Compares Old Regime vs New Regime side by side
 *
 * New Regime slabs FY 2025-26:
 *   0% up to ₹4L | 5% ₹4-8L | 10% ₹8-12L | 15% ₹12-16L
 *   20% ₹16-20L  | 25% ₹20-24L | 30% above ₹24L
 *   Standard deduction: ₹75,000
 *   87A rebate: zero tax if taxable income ≤ ₹12L
 *
 * Old Regime slabs:
 *   0% up to ₹2.5L | 5% ₹2.5-5L | 20% ₹5-10L | 30% above ₹10L
 *   Standard deduction: ₹50,000
 *   87A rebate: zero tax if taxable income ≤ ₹5L (max ₹12,500)
 *
 * NOTE: Slabs are for FY 2025-26. Update after each Union Budget.
 */
(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatINR(n) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function calcSlabTax(income, slabs) {
    var tax = 0;
    for (var i = 0; i < slabs.length; i++) {
      var s = slabs[i];
      if (income <= s.from) break;
      var top = s.to ? s.to : Infinity;
      var taxable = Math.min(income, top) - s.from;
      tax += taxable * s.rate;
    }
    return tax;
  }

  // ── Slab tables ────────────────────────────────────────────────────────────
  var NEW_SLABS = [
    { from: 0,       to: 400000,  rate: 0.00 },
    { from: 400000,  to: 800000,  rate: 0.05 },
    { from: 800000,  to: 1200000, rate: 0.10 },
    { from: 1200000, to: 1600000, rate: 0.15 },
    { from: 1600000, to: 2000000, rate: 0.20 },
    { from: 2000000, to: 2400000, rate: 0.25 },
    { from: 2400000, to: 0,       rate: 0.30 },
  ];

  var OLD_SLABS = [
    { from: 0,       to: 250000,  rate: 0.00 },
    { from: 250000,  to: 500000,  rate: 0.05 },
    { from: 500000,  to: 1000000, rate: 0.20 },
    { from: 1000000, to: 0,       rate: 0.30 },
  ];

  // ── Regime calculators ─────────────────────────────────────────────────────
  function calcNewRegime(gross) {
    var std      = 75000;
    var taxable  = Math.max(0, gross - std);
    var tax      = calcSlabTax(taxable, NEW_SLABS);
    if (taxable <= 1200000) tax = 0;           // 87A full rebate
    var cess     = tax * 0.04;
    return { taxable: taxable, tax: tax, cess: cess, total: tax + cess };
  }

  function calcOldRegime(gross, deductions) {
    var std      = 50000;
    var taxable  = Math.max(0, gross - std - deductions);
    var tax      = calcSlabTax(taxable, OLD_SLABS);
    if (taxable <= 500000) tax = Math.max(0, tax - Math.min(tax, 12500)); // 87A
    var cess     = tax * 0.04;
    return { taxable: taxable, tax: tax, cess: cess, total: tax + cess };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function cardHTML(label, r, winner) {
    var badge = winner ? '<span class="regime-badge">✓ Better for you</span>' : '';
    return (
      '<div class="regime-card' + (winner ? ' regime-card--winner' : '') + '">' +
        '<div class="regime-card__title">' + label + badge + '</div>' +
        '<div class="regime-card__amount">' + formatINR(Math.round(r.total)) + '</div>' +
        '<div class="regime-card__label">Total tax payable</div>' +
        '<div class="regime-rows">' +
          '<div class="regime-row"><span>Taxable income</span><span>' + formatINR(r.taxable) + '</span></div>' +
          '<div class="regime-row"><span>Income tax</span><span>' + formatINR(Math.round(r.tax)) + '</span></div>' +
          '<div class="regime-row"><span>Cess (4%)</span><span>' + formatINR(Math.round(r.cess)) + '</span></div>' +
          '<div class="regime-row regime-row--total"><span>Total payable</span><span>' + formatINR(Math.round(r.total)) + '</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  // ── Main calculate ─────────────────────────────────────────────────────────
  function calculate() {
    var gross  = parseFloat(document.getElementById('gross-income').value)      || 0;
    var d80c   = parseFloat(document.getElementById('deduction-80c').value)     || 0;
    var d80d   = parseFloat(document.getElementById('deduction-80d').value)     || 0;
    var hra    = parseFloat(document.getElementById('hra-exemption').value)     || 0;
    var dOther = parseFloat(document.getElementById('other-deductions').value)  || 0;

    if (gross <= 0) return;

    var oldDeductions = Math.min(d80c, 150000) + Math.min(d80d, 25000) + hra + dOther;

    var nr = calcNewRegime(gross);
    var or = calcOldRegime(gross, oldDeductions);

    var newWins = nr.total <= or.total;
    var saving  = Math.abs(nr.total - or.total);
    var winner  = newWins ? 'New Regime' : 'Old Regime';

    var summary = saving < 500
      ? '<div class="tax-summary"><p class="tax-summary__text">Both regimes give nearly the same tax for your numbers.</p></div>'
      : '<div class="tax-summary"><p class="tax-summary__text"><strong>' + winner +
        ' saves you ' + formatINR(Math.round(saving)) + '/year</strong> based on your numbers.</p></div>';

    // Hide the default "—" primary value
    var primary = document.getElementById('result-primary');
    if (primary) primary.style.display = 'none';

    document.getElementById('result-breakdown').innerHTML =
      summary +
      '<div class="regime-grid">' +
        cardHTML('New Tax Regime', nr, newWins) +
        cardHTML('Old Tax Regime', or, !newWins) +
      '</div>';

    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);
    ['gross-income','deduction-80c','deduction-80d','hra-exemption','other-deductions'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') calculate(); });
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}());
