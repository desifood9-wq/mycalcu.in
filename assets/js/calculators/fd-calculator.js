/**
 * fd-calculator.js — Fixed Deposit Calculator
 * Supports: Monthly, Quarterly, Half-yearly, Annual, and Cumulative compounding
 * Formula: A = P × (1 + r/n)^(n×t)  where n = compounding frequency
 *
 * FD interest rates change frequently — user sets their own rate via slider.
 * No hardcoded bank rates. Rate slider range: 3%–10%.
 *
 * Inputs: #principal, #fd-rate, #tenure-years, #tenure-months, #compound-freq
 * Note: Tax on FD interest — TDS at 10% if interest > ₹40,000/year (₹50,000 for seniors)
 *       This is shown as informational only — not deducted from result (varies by user)
 */
(function () {
  'use strict';

  var FREQ_MAP = {
    'monthly':     12,
    'quarterly':   4,
    'halfyearly':  2,
    'annually':    1,
    'cumulative':  4,   // Cumulative FDs typically compound quarterly
  };

  function formatINR(n) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function calculate() {
    var P      = parseFloat(document.getElementById('principal').value) || 0;
    var rate   = parseFloat(document.getElementById('fd-rate').value) || 6.5;
    var years  = parseInt(document.getElementById('tenure-years').value) || 0;
    var months = parseInt(document.getElementById('tenure-months').value) || 0;
    var freq   = document.getElementById('compound-freq').value || 'quarterly';

    if (P <= 0 || (years === 0 && months === 0)) return;

    var t = years + (months / 12);           // tenure in years
    var r = rate / 100;
    var n = FREQ_MAP[freq] || 4;

    // Maturity amount
    var A = P * Math.pow(1 + r / n, n * t);
    var interest = A - P;

    // TDS threshold info
    var annualInterest = interest / t;
    var tdsFlagged = annualInterest > 40000;

    // Effective annual yield
    var effectiveRate = (Math.pow(1 + r / n, n) - 1) * 100;

    var freqLabel = {
      monthly: 'Monthly', quarterly: 'Quarterly',
      halfyearly: 'Half-yearly', annually: 'Annual', cumulative: 'Cumulative (quarterly)'
    }[freq];

    document.getElementById('result-primary').textContent = formatINR(Math.round(A));

    var rows = [
      { label: 'Principal Amount',          val: formatINR(P),                       cls: '' },
      { label: 'Interest Rate',             val: rate + '% p.a.',                    cls: '' },
      { label: 'Tenure',                    val: (years ? years + ' yr ' : '') + (months ? months + ' mo' : ''), cls: '' },
      { label: 'Compounding',               val: freqLabel,                           cls: '' },
      { label: 'Total Interest Earned',     val: '+' + formatINR(Math.round(interest)), cls: 'positive' },
      { label: 'Maturity Amount',           val: formatINR(Math.round(A)),            cls: 'highlight' },
      { label: 'Effective Annual Yield',    val: effectiveRate.toFixed(2) + '%',      cls: '' },
    ];

    if (tdsFlagged) {
      rows.push({ label: '⚠ TDS may apply', val: 'Annual interest > ₹40,000', cls: '' });
    }

    var container = document.getElementById('result-breakdown');
    container.innerHTML = rows.map(function (r) {
      return '<div class="result-row"><span class="result-row__label">' + r.label +
        '</span><span class="result-row__val ' + r.cls + '">' + r.val + '</span></div>';
    }).join('');

    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function init() {
    // Rate slider
    var rateSlider = document.getElementById('fd-rate');
    var rateLabel  = document.getElementById('fd-rate-val');
    if (rateSlider && rateLabel) {
      rateSlider.addEventListener('input', function () {
        rateLabel.textContent = this.value + '%';
      });
    }
    // Tenure sliders
    var yrSlider = document.getElementById('tenure-years');
    var yrLabel  = document.getElementById('tenure-years-val');
    if (yrSlider && yrLabel) {
      yrSlider.addEventListener('input', function () {
        yrLabel.textContent = this.value + ' yrs';
      });
    }
    var moSlider = document.getElementById('tenure-months');
    var moLabel  = document.getElementById('tenure-months-val');
    if (moSlider && moLabel) {
      moSlider.addEventListener('input', function () {
        moLabel.textContent = this.value + ' mo';
      });
    }

    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);

    var inp = document.getElementById('principal');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') calculate(); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}());
