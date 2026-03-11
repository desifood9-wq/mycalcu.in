/**
 * nps-calculator.js — National Pension System Calculator
 * NPS returns are market-linked — no guaranteed rate.
 * User sets their own expected return via slider.
 *
 * Rules (as of FY 2025-26):
 * - Minimum age to join: 18, Maximum: 70
 * - Retirement age: 60 (default, can extend to 75)
 * - At maturity: minimum 40% must be used to buy annuity
 * - Maximum 60% can be withdrawn as lump sum (tax-free)
 * - Annuity portion is taxable as income in year of receipt
 * - Tax deduction: 80CCD(1) up to 10% of salary (within 80C limit)
 *   + 80CCD(1B) additional ₹50,000 over and above 80C
 *   + 80CCD(2) employer contribution up to 10% of salary (no limit)
 *
 * NOTE: NPS returns are market-linked and not guaranteed.
 * Expected return slider is for projection only.
 *
 * Inputs: #current-age, #monthly-contribution, #expected-return, #annuity-rate
 */
(function () {
  'use strict';

  var RETIREMENT_AGE = 60;

  function formatINR(n) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function calculate() {
    var age         = parseInt(document.getElementById('current-age').value) || 30;
    var monthly     = parseFloat(document.getElementById('monthly-contribution').value) || 0;
    var returnRate  = parseFloat(document.getElementById('expected-return').value) || 10;
    var annuityPct  = parseFloat(document.getElementById('annuity-pct').value) || 40;

    if (monthly <= 0 || age >= RETIREMENT_AGE) return;

    var years       = RETIREMENT_AGE - age;
    var months      = years * 12;
    var r           = returnRate / 100 / 12;  // monthly rate

    // Future value of monthly SIP
    var corpus = monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
    var totalInvested = monthly * months;
    var totalReturns  = corpus - totalInvested;

    // At maturity split
    var lumpsum  = corpus * (1 - annuityPct / 100);
    var annuity  = corpus * (annuityPct / 100);

    // Monthly pension estimate (annuity at ~6% p.a.)
    var ANNUITY_RATE = 0.06;
    var monthlyPension = (annuity * ANNUITY_RATE) / 12;

    // Tax benefit estimate (assuming 30% bracket, ₹50K 80CCD(1B))
    var annualContrib   = monthly * 12;
    var taxSaving80CCD1B = Math.min(50000, annualContrib) * 0.30;

    document.getElementById('result-primary').textContent = formatINR(Math.round(corpus));

    var rows = [
      { label: 'Monthly Contribution',          val: formatINR(monthly),                   cls: '' },
      { label: 'Years to Retirement',           val: years + ' years',                     cls: '' },
      { label: 'Expected Annual Return',        val: returnRate + '% (market-linked)',      cls: '' },
      { label: 'Total Amount Invested',         val: formatINR(totalInvested),              cls: '' },
      { label: 'Total Returns Generated',       val: '+' + formatINR(Math.round(totalReturns)), cls: 'positive' },
      { label: 'Total Corpus at 60',            val: formatINR(Math.round(corpus)),         cls: 'highlight' },
      { label: 'Lump Sum (tax-free, ' + (100 - annuityPct) + '%)', val: formatINR(Math.round(lumpsum)), cls: 'positive' },
      { label: 'Annuity Purchase (' + annuityPct + '%)',    val: formatINR(Math.round(annuity)),    cls: '' },
      { label: 'Est. Monthly Pension (~6% annuity)', val: formatINR(Math.round(monthlyPension)) + '/month', cls: 'highlight' },
      { label: 'Est. Annual Tax Saving (80CCD(1B), 30%)', val: formatINR(Math.round(taxSaving80CCD1B)) + '/year', cls: 'positive' },
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
    [
      { id: 'current-age',      labelId: 'current-age-val',   suffix: ' yrs' },
      { id: 'expected-return',  labelId: 'expected-return-val', suffix: '%' },
      { id: 'annuity-pct',      labelId: 'annuity-pct-val',   suffix: '%' },
    ].forEach(function (s) {
      var el = document.getElementById(s.id);
      var lb = document.getElementById(s.labelId);
      if (el && lb) el.addEventListener('input', function () { lb.textContent = this.value + s.suffix; });
    });

    var btn = document.getElementById('calc-btn');
    if (btn) btn.addEventListener('click', calculate);

    var inp = document.getElementById('monthly-contribution');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') calculate(); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}());
