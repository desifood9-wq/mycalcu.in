/**
 * emi-calculator.js
 * mycalcu.in — Loan EMI Calculator
 *
 * Inputs:  #loan-amount     (principal in ₹)
 *          #interest-rate   (annual interest rate in %)
 *          #tenure-years    (range: loan tenure in years)
 *
 * Outputs: #result-primary    — Monthly EMI
 *          #result-breakdown  — Total payment, total interest, interest ratio
 *          #result-box        — Gets class "visible"
 *
 * Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 *   where r = annual_rate / 12 / 100
 *         n = tenure_years × 12
 */

(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatINR(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }

  function formatPct(ratio) {
    return (ratio * 100).toFixed(1) + '%';
  }

  // ── Core EMI formula ───────────────────────────────────────────────────────
  function computeEMI(principal, annualRate, tenureMonths) {
    if (annualRate === 0) {
      // Zero interest: divide principal evenly
      return principal / tenureMonths;
    }
    var r = annualRate / 12 / 100;
    var power = Math.pow(1 + r, tenureMonths);
    return (principal * r * power) / (power - 1);
  }

  // ── Core calculation ───────────────────────────────────────────────────────
  function calculate() {
    var principal    = parseFloat(document.getElementById('loan-amount').value);
    var annualRate   = parseFloat(document.getElementById('interest-rate').value);
    var tenureYears  = parseInt(document.getElementById('tenure-years').value, 10);

    if (!principal || principal <= 0) {
      alert('Please enter a valid loan amount.');
      return;
    }
    if (isNaN(annualRate) || annualRate < 0) {
      alert('Please enter a valid interest rate.');
      return;
    }
    if (!tenureYears || tenureYears <= 0) {
      alert('Please enter a valid loan tenure.');
      return;
    }

    var tenureMonths  = tenureYears * 12;
    var emi           = computeEMI(principal, annualRate, tenureMonths);
    var totalPayment  = emi * tenureMonths;
    var totalInterest = totalPayment - principal;
    var interestRatio = totalInterest / principal; // e.g. 0.58 means 58% extra

    // ── Render ─────────────────────────────────────────────────────────────
    document.getElementById('result-primary').textContent = formatINR(emi) + '/month';

    var rows = [
      { label: 'Loan Amount (Principal)',  val: formatINR(principal) },
      { label: 'Annual Interest Rate',     val: annualRate.toFixed(2) + '% p.a.' },
      { label: 'Loan Tenure',              val: tenureYears + ' year' + (tenureYears > 1 ? 's' : '') + ' (' + tenureMonths + ' months)' },
      { label: 'Monthly EMI',              val: formatINR(emi),          highlight: true },
      { label: 'Total Amount Payable',     val: formatINR(totalPayment), highlight: false },
      { label: 'Total Interest Payable',   val: formatINR(totalInterest), highlight: false },
      { label: 'Interest to Principal',    val: formatPct(interestRatio) + ' of loan', highlight: false },
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
      var cls = r.highlight ? 'highlight' : '';
      return '<div class="result-row">' +
        '<span class="result-row__label">' + r.label + '</span>' +
        '<span class="result-row__val ' + cls + '">' + r.val + '</span>' +
        '</div>';
    }).join('');
  }

  // ── Slider live label update ───────────────────────────────────────────────
  function initSlider() {
    var slider = document.getElementById('tenure-years');
    var label  = document.getElementById('tenure-val');
    if (!slider || !label) return;
    slider.addEventListener('input', function () {
      var val = parseInt(this.value, 10);
      label.textContent = val + ' year' + (val > 1 ? 's' : '');
    });
  }

  // ── Event binding ──────────────────────────────────────────────────────────
  function init() {
    initSlider();
    var btn = document.getElementById('calc-btn');
    if (btn) {
      btn.addEventListener('click', calculate);
    }
    ['loan-amount', 'interest-rate'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') calculate();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
