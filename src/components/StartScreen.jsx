import React from "react";
import { companyAssets, sectorAssets } from "../assets/generated/assets";

const companyShowcase = [
  { key: "dew_collector", name: "Captadores de rocio" },
  { key: "solar_panel", name: "Red solar" },
  { key: "surface_mine", name: "Mina de superficie" },
];

export default function StartScreen({
  onStartGuest,
  onOpenLogin,
  onOpenRegister,
}) {
  return (
    <div className="pw-start">
      <div className="pw-start__stars" />
      <div className="pw-start__orbit pw-start__orbit--one" />
      <div className="pw-start__orbit pw-start__orbit--two" />

      <main className="pw-start__stage">
        <section className="pw-start__hero" aria-label="Presentacion de AstraCorp">
          <div className="pw-start__copy">
            <div className="pw-start__eyebrow">Terminal de colonia · Nexus Prime</div>
            <h1>ASTRACORP</h1>
            <p className="pw-start__lead">
              Has llegado a un planeta nuevo sin empresa, sin red comercial y sin
              pasaje de salida. Tu primera meta es sencilla: trabajar, producir,
              vender y ahorrar lo suficiente para viajar a otros mundos.
            </p>

            <div className="pw-start__mission">
              <div>
                <span>Objetivo inicial</span>
                <strong>Gana tu primer pasaje orbital</strong>
              </div>
              <p>
                Empieza con trabajos locales, levanta tus primeras empresas y usa
                el mercado para transformar agua, electricidad y mineral en creditos.
              </p>
            </div>

            <div className="pw-start__actions">
              <button type="button" className="pw-start__primary" onClick={onOpenRegister}>
                Crear cuenta
              </button>
              <button type="button" className="pw-start__secondary" onClick={onOpenLogin}>
                Iniciar sesion
              </button>
              <button type="button" className="pw-start__ghost" onClick={onStartGuest}>
                Probar como invitado
              </button>
            </div>
          </div>

          <div className="pw-start__visual" aria-hidden="true">
            <img
              className="pw-start__sector"
              src={sectorAssets.nexusPrime}
              alt=""
            />
            <div className="pw-start__planet">
              <div className="pw-start__planet-map" />
              <div className="pw-start__planet-shade" />
              <div className="pw-start__planet-ring" />
            </div>
            <div className="pw-start__route">
              <span>Nexus Prime</span>
              <b>Veyron</b>
            </div>
          </div>
        </section>

        <section className="pw-start__companies" aria-label="Primeras empresas">
          {companyShowcase.map((company) => (
            <article key={company.key} className="pw-start__company">
              <img src={companyAssets[company.key]} alt="" />
              <div>
                <span>Infraestructura inicial</span>
                <strong>{company.name}</strong>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
