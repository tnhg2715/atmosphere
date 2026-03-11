const css = getComputedStyle(document.documentElement);
const colors = {
  base: css.getPropertyValue("--base-color"),
  gray: css.getPropertyValue("--gray"),
  blue: css.getPropertyValue("--blue"),
  red: css.getPropertyValue("--red"),
  orange: css.getPropertyValue("--orange"),
  yellow: css.getPropertyValue("--yellow"),
  green: css.getPropertyValue("--green")
};

const lat = 35.8617;
const lon = 139.6455;

const pressureEl = document.getElementById("pressure");
const levelEl = document.getElementById("level");

// 過去3日＋今日＋未来3日で7日間
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=surface_pressure_mean&past_days=3&forecast_days=4&timezone=Asia%2FTokyo`)
  .then(res => res.json())
  .then(data => {
    const pressures = data.daily.surface_pressure_mean;
    const dates = data.daily.time;

    console.log("pressures:", pressures);
    console.log("dates:", dates);

    const todayIndex = 3; // 過去3日 → 今日が中央

    const todayP = pressures[todayIndex];
    const yesterdayP = pressures[todayIndex - 1];
    const threeDaysAgoP = pressures[todayIndex - 3];

    const diffYesterday = todayP - yesterdayP;
    const diff3days = todayP - threeDaysAgoP;

    // --- 今日の気圧 ---
    pressureEl.textContent = `${todayP.toFixed(1)} hPa`;

    // --- 絶対値レベル ---
    let levelText = "";
    let levelClass = "";
  
    let levelColor = colors.base; // デフォルト

    if (todayP >= 1020) {
      levelText = "高め";
      levelColor = colors.blue;
    } else if (todayP <= 1010) {
      levelText = "低め";
      levelColor = colors.red;
    } else {
      levelText = "普通";
      levelColor = colors.green;
    }

    // 状態判定（前日差・3日差の絶対値を使う）
    const maxChange = Math.max(Math.abs(diffYesterday), Math.abs(diff3days));

    let icon = "通常"; // デフォルト
    let color = colors.gray;

    if (maxChange >= 12) {
      icon = "超警戒";
      color = colors.red;
    } else if (maxChange >= 8) {
      icon = "警戒";
      color = colors.orange;
    } else if (maxChange >= 5) {
      icon = "注意";
      color = colors.yellow;
    }
  
    // 表示
    pressureLevelValue.textContent = levelText;
    pressureLevelValue.style.color = levelColor; // 高め/普通/低め用の色

    pressureAlertValue.textContent = icon;
    pressureAlertValue.style.color = color;

    // 太字判定
    if (maxChange >= 5) {
      pressureAlertValue.style.fontWeight = "600";
    } else {
      pressureAlertValue.style.fontWeight = "400";
    }

    // --- 日付整形（今日のラベルだけ目立たせる） ---
    const formattedDates = dates.map((d, i) => {
      const dateObj = new Date(d);
      const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      if (i === todayIndex) {
        return [label, "▴"]; // 配列にする
      }
      return label;
    });

    const pointColors = pressures.map((_, i) =>
      i === todayIndex ? colors.base : colors.gray // 今日だけ色変え
    );
    const pointSizes = pressures.map((_, i) =>
      i === todayIndex ? 4 : 3 // 今日だけ大きく
    );

    // --- ミニマルグラフ ---
    new Chart(document.getElementById("miniChart"), {
      type: "line",
      data: {
        labels: formattedDates,
        datasets: [{
          data: pressures,
          borderWidth: 1,
          tension: 0.4,
          fill: false,

          pointRadius: pointSizes,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointBorderWidth: 0,

          borderColor: colors.gray  // 線の色
        }]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
              
              color: function(context) {
                return context.index === todayIndex ? colors.base : colors.gray;
              },
              font: function(context) {
                return {
                  weight: context.index === todayIndex ? "700" : "400",
                  size: context.index === todayIndex ? 13 : 11
                };
              }
            },
            grid: {
              display: true,
              color: "rgba(0,0,0,0.05)", // 薄い縦線
              drawBorder: false
            }
          },
          y: { display: false }
        }
      }
    });
  })
  .catch(err => {
    console.error("データ取得エラー:", err);
  });
