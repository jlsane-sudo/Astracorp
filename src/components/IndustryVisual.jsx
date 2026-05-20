import React from "react";

function DewCollector({ active }) {
  return (
    <div className={`job-visual machine dew ${active ? "is-active" : ""}`}>
      <div className="machine__glow" />
      <div className="machine__top" />
      <div className="machine__tube">
        <div className="machine__energy" />
        <div className="machine__swirl swirl-1" />
        <div className="machine__swirl swirl-2" />
      </div>
      <div className="machine__arm left">
        <div className="machine__lamp" />
        <div className="drop drop-1" />
        <div className="drop drop-2" />
      </div>
      <div className="machine__arm right">
        <div className="machine__lamp" />
        <div className="drop drop-3" />
        <div className="drop drop-4" />
      </div>
      <div className="machine__core">
        <div className="machine__beam" />
      </div>
      <div className="machine__base">
        <div className="machine__pool" />
        <div className="machine__ringLights" />
      </div>
    </div>
  );
}

function SolarPanel({ active }) {
  return (
    <div className={`job-visual solar ${active ? "is-active" : ""}`}>
      <div className="solar__glow" />
      <div className="solar__sun" />
      <div className="solar__mast" />
      <div className="solar__panel panel-left">
        <div className="solar__cells" />
      </div>
      <div className="solar__panel panel-right">
        <div className="solar__cells" />
      </div>
      <div className="solar__energyLine line-1" />
      <div className="solar__energyLine line-2" />
      <div className="solar__base" />
    </div>
  );
}

function SurfaceMine({ active }) {
  return (
    <div className={`job-visual mine ${active ? "is-active" : ""}`}>
      <div className="mine__glow" />
      <div className="mine__mountain" />
      <div className="mine__drillTower">
        <div className="mine__drillHead" />
        <div className="mine__spark spark-1" />
        <div className="mine__spark spark-2" />
        <div className="mine__spark spark-3" />
      </div>
      <div className="mine__belt">
        <div className="mine__ore ore-1" />
        <div className="mine__ore ore-2" />
        <div className="mine__ore ore-3" />
      </div>
      <div className="mine__base" />
    </div>
  );
}

function WaterPurifier({ active }) {
  return (
    <div className={`job-visual purifier ${active ? "is-active" : ""}`}>
      <div className="purifier__glow" />
      <div className="purifier__tank dirty">
        <div className="purifier__liquid dirty-liquid" />
      </div>
      <div className="purifier__pipe pipe-top" />
      <div className="purifier__filter">
        <div className="purifier__filterCore" />
        <div className="purifier__pulse" />
      </div>
      <div className="purifier__pipe pipe-bottom" />
      <div className="purifier__tank clean">
        <div className="purifier__liquid clean-liquid" />
      </div>
      <div className="purifier__bubble bubble-1" />
      <div className="purifier__bubble bubble-2" />
      <div className="purifier__bubble bubble-3" />
    </div>
  );
}

function Smelter({ active }) {
  return (
    <div className={`job-visual smelter ${active ? "is-active" : ""}`}>
      <div className="smelter__glow" />
      <div className="smelter__chimney" />
      <div className="smelter__smoke smoke-1" />
      <div className="smelter__smoke smoke-2" />
      <div className="smelter__smoke smoke-3" />
      <div className="smelter__furnace">
        <div className="smelter__lava" />
        <div className="smelter__heat heat-1" />
        <div className="smelter__heat heat-2" />
      </div>
      <div className="smelter__pour">
        <div className="smelter__stream" />
      </div>
      <div className="smelter__ingot ingot-1" />
      <div className="smelter__ingot ingot-2" />
      <div className="smelter__base" />
    </div>
  );
}

function GenericIndustry({ active }) {
  return (
    <div className={`job-visual generic ${active ? "is-active" : ""}`}>
      <div className="generic__glow" />
      <div className="generic__core">
        <div className="generic__ring ring-1" />
        <div className="generic__ring ring-2" />
        <div className="generic__dot dot-1" />
        <div className="generic__dot dot-2" />
        <div className="generic__dot dot-3" />
      </div>
      <div className="generic__base" />
    </div>
  );
}

export default function IndustryVisual({ type, active = false, size = 170 }) {
  const style = {
    width: size,
    height: Math.round(size * 1.05),
  };

  return (
    <div className={`job-visual-wrap job-visual-wrap--${type || "generic"}`} style={style}>
      {type === "dew_collector" && <DewCollector active={active} />}
      {type === "solar_panel" && <SolarPanel active={active} />}
      {type === "surface_mine" && <SurfaceMine active={active} />}
      {type === "water_purifier" && <WaterPurifier active={active} />}
      {type === "smelter" && <Smelter active={active} />}
      {![
        "dew_collector",
        "solar_panel",
        "surface_mine",
        "water_purifier",
        "smelter",
      ].includes(type) && <GenericIndustry active={active} />}
    </div>
  );
}
