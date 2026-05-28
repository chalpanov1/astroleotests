// main.js
// main.js – интерфейсная логика АстроБота
(function() {
    // Проверка загрузки Astronomy
    if (typeof Astronomy === 'undefined') {
        document.getElementById('errorContainer').style.display = 'block';
        document.getElementById('errorContainer').textContent = 'Ошибка: библиотека Astronomy не загрузилась.';
        return;
    }

    // ---------- Инициализация городов ----------
    const cities = citiesData;   // из cities.js (глобальная переменная)

    function normalizeCityName(name) {
        return name.replace(/ё/g, 'е').toLowerCase().trim();
    }

    const cityInput = document.getElementById('cityInput');
    const suggestionsList = document.getElementById('suggestionsList');
    const cityTzInfo = document.getElementById('cityTzInfo');
    const timezoneOffsetSelect = document.getElementById('timezoneOffset');

    // Функция обновления информации о часовом поясе
    function updateCityTzInfo() {
        const city = cityInput.dataset.selected;
        if (city && cities[city]) {
            const tz = cities[city].tz;
            const birthDate = document.getElementById('birthDate').value;
            let date = new Date();
            if (birthDate) {
                const [year, month, day] = birthDate.split('-').map(Number);
                date = new Date(year, month - 1, day, 12, 0, 0);
            }
            const s = spacetime(date, tz);
            const offsetHours = s.timezone().current.offset;
            const rounded = Math.round(offsetHours * 4) / 4;   // округление до 15 минут
            let offsetStr = '';
            if (rounded >= 0) offsetStr = '+' + rounded;
            else offsetStr = rounded.toString();
            if (offsetStr.endsWith('.0')) offsetStr = offsetStr.slice(0, -2);
            cityTzInfo.textContent = `Часовой пояс: UTC ${offsetStr}`;
        } else {
            cityTzInfo.textContent = '';
        }
    }

    // ---------- Поиск города ----------
    cityInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        if (query.length === 0) {
            delete this.dataset.selected;
            cityTzInfo.textContent = '';
        }
        if (query.length < 2) {
            suggestionsList.style.display = 'none';
            return;
        }
        const normalizedQuery = normalizeCityName(query);
        const matches = Object.keys(cities)
            .filter(city => normalizeCityName(city).startsWith(normalizedQuery))
            .slice(0, 10);
        if (matches.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        }
        suggestionsList.innerHTML = matches
            .map(city => `<div class="suggestion-item" data-city="${city}">${city}</div>`)
            .join('');
        suggestionsList.style.display = 'block';
    });

    // ---------- Выбор города из подсказок ----------
    suggestionsList.addEventListener('click', function(e) {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;
        const city = item.dataset.city;
        cityInput.value = city;
        cityInput.dataset.selected = city;
        // Сброс ручного UTC при выборе города
        timezoneOffsetSelect.value = '0';
        suggestionsList.style.display = 'none';
        updateCityTzInfo();
    });

    // ---------- Закрытие подсказок при клике вне ----------
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#cityInput') && !e.target.closest('#suggestionsList')) {
            suggestionsList.style.display = 'none';
        }
    });

    // ---------- Обновление UTC при изменении даты/времени ----------
    document.getElementById('birthDate').addEventListener('change', updateCityTzInfo);
    document.getElementById('birthTime').addEventListener('change', updateCityTzInfo);

    // ---------- Ручной выбор UTC ----------
    timezoneOffsetSelect.addEventListener('change', function() {
        // При ручном выборе UTC сбрасываем город
        cityInput.value = '';
        delete cityInput.dataset.selected;
        cityTzInfo.textContent = '';
    });

    // ---------- Обработчик кнопки «Рассчитать» ----------
    document.getElementById('calculateBtn').addEventListener('click', () => {
        const dateInput = document.getElementById('birthDate').value;
        const timeInput = document.getElementById('birthTime').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;

        const errorDiv = document.getElementById('errorContainer');
        const resultDiv = document.getElementById('resultContainer');
        errorDiv.style.display = 'none';
        resultDiv.style.display = 'none';

        if (!dateInput) {
            errorDiv.textContent = 'Пожалуйста, выберите дату рождения.';
            errorDiv.style.display = 'block';
            return;
        }

        const [year, month, day] = dateInput.split('-').map(Number);
        const [hours, minutes] = timeInput ? timeInput.split(':').map(Number) : [12, 0];

        // Определяем часовой пояс
        const city = cityInput.dataset.selected;
        let tz = null;
        if (city && cities[city]) {
            tz = cities[city].tz;                // IANA-строка (город)
        } else {
            tz = parseInt(timezoneOffsetSelect.value); // число (ручной UTC)
        }

        const utcDate = getUTCDate(year, month, day, hours, minutes, tz); // из astrology.js
        const astroTime = new Astronomy.AstroTime(utcDate);

        try {
            // Получаем эклиптические долготы планет
            const sunLon = getGeoEclipticLongitude('Sun', astroTime);
            const moonLon = getGeoEclipticLongitude('Moon', astroTime);
            const mercuryLon = getGeoEclipticLongitude('Mercury', astroTime);
            const venusLon = getGeoEclipticLongitude('Venus', astroTime);
            const marsLon = getGeoEclipticLongitude('Mars', astroTime);
            const jupiterLon = getGeoEclipticLongitude('Jupiter', astroTime);
            const saturnLon = getGeoEclipticLongitude('Saturn', astroTime);
            const uranusLon = getGeoEclipticLongitude('Uranus', astroTime);
            const neptuneLon = getGeoEclipticLongitude('Neptune', astroTime);
            const plutoLon = getGeoEclipticLongitude('Pluto', astroTime);

            // Определяем знаки Зодиака
            const sunSign = getZodiacSign(sunLon);
            const moonSign = getZodiacSign(moonLon);
            const mercSign = getZodiacSign(mercuryLon);
            const venusSign = getZodiacSign(venusLon);
            const marsSign = getZodiacSign(marsLon);
            const jupSign = getZodiacSign(jupiterLon);
            const satSign = getZodiacSign(saturnLon);
            const uraSign = getZodiacSign(uranusLon);
            const nepSign = getZodiacSign(neptuneLon);
            const pluSign = getZodiacSign(plutoLon);

            // Генерируем сводку
            const { intro, elementSummary, tableHTML } = generatePersonalitySummary(
                sunSign, moonSign, mercSign, venusSign, marsSign,
                jupSign, satSign, uraSign, nepSign, pluSign, gender
            );

            // Выводим результат
            resultDiv.innerHTML = `
                <div class="card summary">
                    <h3>🔮 Силы стихий</h3>
                    <p class="description">${elementSummary}</p>
                    <div class="table-wrapper">${tableHTML}</div>
                </div>
                <div class="card">
                    <h3><span class="sign-icon">${sunSign.emoji}</span> Солнце в знаке ${sunSign.name}</h3>
                    <p class="description">${sunDesc[sunSign.name]}</p>
                    <button class="toggle-details">Читать подробнее</button>
                    <div class="details" style="display:none;">${detailedSunDesc[sunSign.name]}</div>
                </div>
                <div class="card">
                    <h3><span class="sign-icon">${moonSign.emoji}</span> Луна в знаке ${moonSign.name}</h3>
                    <p class="description">${moonDesc[moonSign.name]}</p>
                    <button class="toggle-details">Читать подробнее</button>
                    <div class="details" style="display:none;">${detailedMoonDesc[moonSign.name]}</div>
                </div>
                <div class="card">
                    <h3><span class="sign-icon">☿</span> Меркурий в знаке ${mercSign.name}</h3>
                    <p class="description">${mercuryDesc[mercSign.name]}</p>
                    <button class="toggle-details">Читать подробнее</button>
                    <div class="details" style="display:none;">${detailedMercuryDesc[mercSign.name]}</div>
                </div>
                <div class="card">
                    <h3><span class="sign-icon">♀</span> Венера в знаке ${venusSign.name}</h3>
                    <p class="description">${venusDesc[venusSign.name]}</p>
                    <button class="toggle-details">Читать подробнее</button>
                    <div class="details" style="display:none;">${detailedVenusDesc[venusSign.name]}</div>
                </div>
                <div class="card">
                    <h3><span class="sign-icon">♂</span> Марс в знаке ${marsSign.name}</h3>
                    <p class="description">${marsDesc[marsSign.name]}</p>
                    <button class="toggle-details">Читать подробнее</button>
                    <div class="details" style="display:none;">${detailedMarsDesc[marsSign.name]}</div>
                </div>
                <div class="card summary">
                    <h3>🔮 5 главных планет — ваш портрет</h3>
                    <p class="description">${intro}</p>
                </div>
            `;
            resultDiv.style.display = 'block';

            // Делегирование кликов для кнопок «Читать подробнее»
            resultDiv.onclick = function(e) {
                const btn = e.target.closest('.toggle-details');
                if (!btn) return;
                const details = btn.nextElementSibling;
                if (details && details.classList.contains('details')) {
                    const isHidden = details.style.display === 'none';
                    details.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? 'Свернуть' : 'Читать подробнее';
                }
            };
        } catch (err) {
            console.error(err);
            errorDiv.textContent = 'Ошибка: ' + (err.message || err);
            errorDiv.style.display = 'block';
        }
    });

    // Предзаполнение даты и времени
    document.getElementById('birthDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('birthTime').value = '12:00';
    window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500); // соответствует длительности transition
    }
});
})();