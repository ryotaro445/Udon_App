-- menu_daily_forecast: 予測結果の保存先
-- 主キーは (menu_id, ds, model) でユニーク制約
CREATE TABLE IF NOT EXISTS menu_daily_forecast (
    menu_id     INTEGER     NOT NULL,
    ds          DATE        NOT NULL,
    yhat        REAL        NOT NULL,
    yhat_lo     REAL        NOT NULL,
    yhat_hi     REAL        NOT NULL,
    model       TEXT        NOT NULL, -- 'seasonal_ma_k4' / 'naive_tminus7' など
    trained_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (menu_id, ds, model)
);

-- 参照性（存在すれば）
-- SQLiteの場合は外部キーを有効化していないと効かないためコメントアウト推奨
-- ALTER TABLE menu_daily_forecast
-- ADD CONSTRAINT fk_menu_daily_forecast_menu
-- FOREIGN KEY (menu_id) REFERENCES menus(id);