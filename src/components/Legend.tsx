import {style} from "typestyle";
import {EventConfig} from "../Utils/EventConfig";
import React from "react";

const legendBorderDivStyle = style({
  borderRadius:"4px",
  border: "4px solid",
  display:"inline-block",
  color:"#ffffff",
  fontFamily:"Lato,Helvetica Neue,Arial,Helvetica,sans-serif",
  fontSize:"14px",
  padding:"5px 5px",
  margin: "10px 10px 10px 0px"
});

const eventIconStyle = style({
  verticalAlign: "middle"
});

const eventDescriptionStyle = style({
  display: "inline",
  color: "black"
});

const eventDivStyle = style({
  marginTop: "5px",
  marginBottom: "5px"
});


interface LegendProps {
  filters?: boolean
  eventConfig?: EventConfig<string>,
  iconHeight: number,
  iconWidth: number,
}

function redraw() {
  console.log("redraw")
}

export function Legend({
    filters,
    eventConfig,
    iconHeight,
    iconWidth
  }: LegendProps) {
  let eventTypeDescriptions = new Array<Object>();
  let transform = `translate(${iconHeight/2}, ${iconWidth/2-2.5})`;

  if(eventConfig){
    for (let key in eventConfig) {
      let event = eventConfig[key];
      let eventDiv = <div className={eventDivStyle} key={key}>
        {filters &&
        <input type="checkbox" id={key+" checkbox"} name={key} value={key} onClick={redraw}></input>
        }
        <svg height={iconHeight} width={iconWidth} className={eventIconStyle} >
          <g transform={transform}>
            {event.backboneGlyph}
          </g>
        </svg>
        <p className={eventDescriptionStyle}>{event.description ? event.description : "Event description missing"}</p>
      </div>
      eventTypeDescriptions.push(eventDiv);
    }
  }
  return <div id="Legend" className={legendBorderDivStyle}>
    {eventTypeDescriptions}
  </div>
}
