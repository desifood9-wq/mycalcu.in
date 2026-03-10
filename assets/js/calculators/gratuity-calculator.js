/**
 * gratuity-calculator.js — Gratuity Calculator
 * Formula: Gratuity = (Last Drawn Salary × 15 × Years of Service) / 26
 * Statutory rate under Payment of Gratuity Act, 1972
 * "Last Drawn Salary" = Basic + Dearness Allowance
 * 26 = working days in a month (statutory)
 * 15 = half month's salary per year of service
 *
 * Inputs: #basic-salary, #years-of-service, #months-of-service
 */
(function () {
  'use strict';

  function formatINR(n) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function calculate() {
    var basic  = parseFloat(document.getElementById('basic-salary').value) || 0;
    var years  = parseInt(document.getElementById('years-of-service').value) || 0;
    var months = parseInt(document.getElementById('months-of-service').value) || 0;

    if (basic <= 0 || years < 5) {
      var box = document.getElementById('result-box');
      if (years > 0 && years < 5) {
        document.getElementById('result-primary').textContent = 'Not eligible';
        document.getElementById('result-breakdown').innerHTML =
          '<div class="result-row"><span class="result-row__label">Minimum service required</span>' +
          '<span class="result-row__val">5 years</span></div>' +
          '<div class="result-row"><span class="result-row__label">Your service</span>' +
          '<span class="result-row__val">' + years + ' years ' + months + ' months</span></div>' +
          '<div class="result-row"><span class="result-row__label">Years remaining</span>' +
          '<span class="result-row__val">' + (5 - years) + ' years</span></div>';
        box.classList.add('visible');
      }
      return;
    }

    // Round up months ≥ 6 to next year (as per Act)
    var totalYears = months >= 6 ? years + 1 : years;

    // Gratuity formula
    var gratuity = (basic * 15 * totalYears) / 26;

    // Tax exemption limit (₹20 lakh as per current rules)
    var EXEMPT_LIMIT = 2000000;
    var taxable = Math.max(0, gratuity - EXEMPT_LIMIT);
    var exempt  = Math.min(gratuity, EXEMPT_LIMIT);

    document.getElementById('result-primary').textContent = formatINR(gratuity);

    var rows = [
      { label: 'Last Drawn Basic Salary',         val: formatINR(basic) + '/month',    cls: '' },
      { label: 'Years of Service (rounded)',       val: totalYears + ' years',          cls: '' },
      { label: 'Gratuity Formula',                 val: '(Basic × 15 × Years) ÷ 26',   cls: '' },
      { label: 'Gratuity Amount',                  val: formatINR(gratuity),            cls: 'highlight' },
      { label: 'Tax-Free Amount (up to ₹20L)',     val: formatINR(exempt),              cls: 'positive' },
      { label: 'Taxable Gratuity',                 val: formatINR(taxable),             cls: taxable > 0 ? '' : 'positive' },
    ];

    var container = document.getElementById('result-breakdown');
    container.innerHTML = rows.map(function (r) {
      return '<div class="result-row"><span class="result-row__label">' + r.label +
        '</span><span class="result-row__val ' + r.cls + '">' + r.val + '</span></div>';
    }).join('');

    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function init() {
    // Wire sliders to live labels
    [
      { id: 'years-of-service',  labelId: 'years-val',  suffix: ' yrs' },
      { id: 'months-of-service', labelId: 'months-val', suffix: ' months' },
    ].forEach(function (s) {
      var el = document.getElementById(s.id);
      var lb = document.getElementById(s.labelId);
      if (el && lb) el.addEventListener('input', function () { lb.textContent = this.value + s.suffix; });
    });

    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);

    var inp = document.getElementById('basic-salary');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') calculate(); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}());
