/**
 * ppf-calculator.js — PPF Maturity Calculator
 * Rate: user-adjustable slider (default 7.1% FY 2025-26)
 * When government changes PPF rate, user just slides the rate input.
 * Inputs: #annual-investment, #ppf-rate, #tenure-years
 */
(function () {
  'use strict';

  function formatINR(n) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function calculate() {
    var P     = parseFloat(document.getElementById('annual-investment').value) || 0;
    var rate  = parseFloat(document.getElementById('ppf-rate').value) || 7.1;
    var years = parseInt(document.getElementById('tenure-years').value) || 15;

    if (P <= 0) return;
    P = Math.min(P, 150000);

    var r = rate / 100;
    var balance = 0;
    var totalInvested = 0;

    for (var y = 1; y <= years; y++) {
      balance = (balance + P) * (1 + r);
      totalInvested += P;
    }

    var interest = balance - totalInvested;
    var effectiveYield = (rate / (1 - 0.30)).toFixed(2); // 30% bracket equivalent

    document.getElementById('result-primary').textContent = formatINR(balance);

    var rows = [
      { label: 'Annual Investment',                   val: formatINR(P),                       cls: '' },
      { label: 'PPF Interest Rate',                   val: rate + '% p.a. (tax-free)',         cls: '' },
      { label: 'Investment Duration',                 val: years + ' years',                   cls: '' },
      { label: 'Total Amount Invested',               val: formatINR(totalInvested),            cls: '' },
      { label: 'Total Interest Earned',               val: '+' + formatINR(Math.round(interest)), cls: 'positive' },
      { label: 'Maturity Amount',                     val: formatINR(balance),                 cls: 'highlight' },
      { label: 'Pre-tax equivalent yield (30% slab)', val: '~' + effectiveYield + '%',         cls: '' },
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
    // Wire all sliders to their live labels
    [
      { id: 'ppf-rate',     labelId: 'ppf-rate-val',     suffix: '%' },
      { id: 'tenure-years', labelId: 'tenure-years-val', suffix: ' yrs' },
    ].forEach(function (s) {
      var el = document.getElementById(s.id);
      var lb = document.getElementById(s.labelId);
      if (el && lb) el.addEventListener('input', function () { lb.textContent = this.value + s.suffix; });
    });

    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);

    var inp = document.getElementById('annual-investment');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') calculate(); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}());
