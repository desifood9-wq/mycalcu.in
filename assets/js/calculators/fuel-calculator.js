/**
 * fuel-calculator.js
 * mycalcu.in — Fuel Cost Per KM Calculator
 *
 * Inputs:  #fuel-price   (₹ per litre)
 *          #mileage      (km per litre — real world)
 *          #monthly-km   (optional: km driven per month)
 *
 * Outputs: #result-primary    — Cost per km (₹/km)
 *          #result-breakdown  — Per-km cost + optional monthly cost
 *          #result-box        — Gets class "visible"
 *
 * Formula: cost_per_km = fuel_price / mileage
 *          monthly_cost = cost_per_km × monthly_km
 */

(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatINR(amount) {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatKM(km) {
    return km.toLocaleString('en-IN') + ' km';
  }

  // ── Core calculation ───────────────────────────────────────────────────────
  function calculate() {
    var fuelPrice = parseFloat(document.getElementById('fuel-price').value);
    var mileage   = parseFloat(document.getElementById('mileage').value);
    var monthlyKM = parseFloat(document.getElementById('monthly-km').value) || 0;

    if (!fuelPrice || fuelPrice <= 0) {
      alert('Please enter a valid fuel price.');
      return;
    }
    if (!mileage || mileage <= 0) {
      alert('Please enter a valid mileage.');
      return;
    }

    var costPerKM    = fuelPrice / mileage;
    var litresPer100 = 100 / mileage;           // L/100km — useful reference
    var monthlyCost  = monthlyKM > 0 ? costPerKM * monthlyKM : null;
    var monthlyLitres = monthlyKM > 0 ? monthlyKM / mileage : null;

    // ── Render ─────────────────────────────────────────────────────────────
    document.getElementById('result-primary').textContent = formatINR(costPerKM) + ' per km';

    var rows = [
      { label: 'Fuel Price',           val: formatINR(fuelPrice) + '/litre' },
      { label: 'Vehicle Mileage',      val: mileage.toFixed(1) + ' km/litre' },
      { label: 'Fuel Consumption',     val: litresPer100.toFixed(2) + ' L per 100 km' },
      { label: 'Cost Per KM',          val: formatINR(costPerKM), highlight: true },
    ];

    if (monthlyCost !== null) {
      rows.push({ label: 'Monthly Distance',   val: formatKM(monthlyKM) });
      rows.push({ label: 'Monthly Fuel Used',  val: monthlyLitres.toFixed(1) + ' litres' });
      rows.push({ label: 'Monthly Fuel Cost',  val: formatINR(monthlyCost), highlight: true });
    }

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

  // ── Event binding ──────────────────────────────────────────────────────────
  function init() {
    var btn = document.getElementById('calc-btn');
    if (btn) {
      btn.addEventListener('click', calculate);
    }
    ['fuel-price', 'mileage', 'monthly-km'].forEach(function (id) {
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
