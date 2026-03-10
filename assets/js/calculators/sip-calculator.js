/**
 * sip-calculator.js
 * mycalcu.in — SIP Returns Calculator
 *
 * Formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r)
 * Where:
 *   P = monthly investment (₹)
 *   r = monthly rate = annual rate / 12
 *   n = total months
 *
 * Inputs:  #monthly-sip     — monthly investment amount
 *          #tenure-years    — investment duration (range)
 *          #expected-return — expected annual return % (range)
 *
 * Outputs: #result-primary    — total corpus at maturity
 *          #result-breakdown  — invested / returns / corpus breakdown
 *          #result-box        — gets class "visible"
 */

(function () {
  'use strict';

  function formatINR(amount) {
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    if (amount >= 100000)   return '₹' + (amount / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }

  function formatINRFull(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }

  function calculate() {
    var P = parseFloat(document.getElementById('monthly-sip').value) || 0;
    var years = parseFloat(document.getElementById('tenure-years').value) || 0;
    var annualRate = parseFloat(document.getElementById('expected-return').value) || 0;

    if (P <= 0 || years <= 0 || annualRate <= 0) return;

    var n = years * 12;
    var r = annualRate / 100 / 12;

    // Future Value of SIP
    var FV = P * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    var totalInvested = P * n;
    var totalReturns = FV - totalInvested;
    var wealthRatio = FV / totalInvested;

    // Update result
    document.getElementById('result-primary').textContent = formatINR(FV);

    var rows = [
      { label: 'Monthly SIP Amount',      val: formatINRFull(P),             cls: '' },
      { label: 'Investment Duration',      val: years + ' years (' + n + ' months)', cls: '' },
      { label: 'Expected Annual Return',   val: annualRate + '%',             cls: '' },
      { label: 'Total Amount Invested',    val: formatINRFull(totalInvested), cls: '' },
      { label: 'Total Returns Generated',  val: '+' + formatINRFull(Math.round(totalReturns)), cls: 'positive' },
      { label: 'Total Corpus at Maturity', val: formatINR(FV),                cls: 'highlight' },
      { label: 'Wealth Ratio',             val: wealthRatio.toFixed(2) + '×', cls: 'highlight' },
    ];

    var container = document.getElementById('result-breakdown');
    container.innerHTML = rows.map(function (r) {
      return '<div class="result-row">' +
        '<span class="result-row__label">' + r.label + '</span>' +
        '<span class="result-row__val ' + r.cls + '">' + r.val + '</span>' +
        '</div>';
    }).join('');

    // Growth bar
    var pct = Math.min(95, Math.round((totalReturns / FV) * 100));
    var bar = document.getElementById('growth-bar');
    if (bar) {
      bar.innerHTML =
        '<div class="growth-bar">' +
          '<div class="growth-bar__invested" style="width:' + (100 - pct) + '%">' +
            '<span>Invested ' + (100 - pct) + '%</span>' +
          '</div>' +
          '<div class="growth-bar__returns" style="width:' + pct + '%">' +
            '<span>Returns ' + pct + '%</span>' +
          '</div>' +
        '</div>';
    }

    var box = document.getElementById('result-box');
    box.classList.add('visible');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function initSliders() {
    var sliders = [
      { id: 'tenure-years',    labelId: 'tenure-years-val',    suffix: ' yrs' },
      { id: 'expected-return', labelId: 'expected-return-val', suffix: '%' },
    ];
    sliders.forEach(function (s) {
      var el = document.getElementById(s.id);
      var lb = document.getElementById(s.labelId);
      if (!el || !lb) return;
      el.addEventListener('input', function () {
        lb.textContent = this.value + s.suffix;
      });
    });
  }

  function init() {
    initSliders();
    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);
    document.querySelectorAll('#monthly-sip').forEach(function (el) {
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
