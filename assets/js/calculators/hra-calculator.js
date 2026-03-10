/**
 * hra-calculator.js — HRA Exemption Calculator
 * Section 10(13A) — Old Tax Regime only
 * Inputs: #basic-salary, #hra-received, #rent-paid, #city-type
 */
(function () {
  'use strict';

  function formatINR(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function calculate() {
    var basic    = parseFloat(document.getElementById('basic-salary').value) || 0;
    var hra      = parseFloat(document.getElementById('hra-received').value) || 0;
    var rent     = parseFloat(document.getElementById('rent-paid').value) || 0;
    var cityType = document.getElementById('city-type').value;

    if (basic <= 0) return;

    var pct      = cityType === 'metro' ? 0.50 : 0.40;
    var calc1    = hra;
    var calc2    = basic * pct;
    var calc3    = Math.max(0, rent - (basic * 0.10));
    var exempt   = Math.min(calc1, calc2, calc3);
    var taxable  = hra - exempt;
    var annualExempt  = exempt * 12;
    var annualTaxable = taxable * 12;

    document.getElementById('result-primary').textContent = formatINR(exempt) + '/month';

    var rows = [
      { label: 'Calculation 1 — HRA received',                          val: formatINR(calc1),         cls: '' },
      { label: 'Calculation 2 — ' + (cityType === 'metro' ? '50' : '40') + '% of basic', val: formatINR(calc2), cls: '' },
      { label: 'Calculation 3 — Rent minus 10% of basic',               val: formatINR(calc3),         cls: '' },
      { label: 'HRA Exemption (lowest of 3)',                            val: formatINR(exempt) + '/month', cls: 'highlight' },
      { label: 'Annual HRA Exemption',                                   val: formatINR(annualExempt) + '/year', cls: 'highlight' },
      { label: 'Taxable HRA',                                            val: formatINR(taxable) + '/month', cls: '' },
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
    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);
    ['basic-salary','hra-received','rent-paid'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function(e) { if (e.key === 'Enter') calculate(); });
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}());
