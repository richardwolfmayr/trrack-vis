import { Provenance, ProvenanceNode, ProvenanceGraph, StateNode } from '@visdesignlab/trrack';
import React, { ReactChild } from 'react';
import { Animate } from 'react-move';
import { Popup } from 'semantic-ui-react';

import { BundleMap } from '../Utils/BundleMap';
import { EventConfig } from '../Utils/EventConfig';
import translate from '../Utils/translate';
import { treeColor } from './Styles';
import {
  symbol,
  symbolSquare, symbolTriangle, symbolWye
} from "d3-shape";
import {style} from "typestyle";

interface BackboneNodeProps<T, S extends string, A> {
  prov?: Provenance<T, S, A>;
  first: boolean;
  iconOnly: boolean;
  current: boolean;
  duration: number;
  node: StateNode<T, S, A>;
  radius: number;
  strokeWidth: number;
  textSize: number;
  setBookmark: any;
  bookmark: boolean;
  nodeMap: any;
  annotationOpen: number;
  setAnnotationOpen: any;
  exemptList: string[];
  setExemptList: any;
  bundleMap?: BundleMap;
  clusterLabels: boolean;
  editAnnotations: boolean;
  eventConfig?: EventConfig<S>;
  popupContent?: (nodeId: StateNode<T, S, A>) => ReactChild;
  annotationContent?: (nodeId: StateNode<T, S, A>) => ReactChild;
  expandedClusterList?: string[];
  cellsVisArea?: number;
  yOffset: number;
}



function BackboneNode<T, S extends string, A>({
  prov,
  first,
  iconOnly,
  current,
  node,
  duration,
  radius,
  strokeWidth,
  textSize,
  nodeMap,
  annotationOpen,
  setBookmark,
  bookmark,
  setAnnotationOpen,
  exemptList,
  setExemptList,
  bundleMap,
  clusterLabels,
  eventConfig,
  popupContent,
  editAnnotations,
  annotationContent,
  expandedClusterList,
  cellsVisArea,
  yOffset = 10,
}: BackboneNodeProps<T, S, A>) {
  const padding = 15;

  let cursorStyle = {
    cursor: "pointer",
  } as React.CSSProperties;

  // console.log(JSON.parse(JSON.stringify(node)));
  let glyph = (
    <circle
      style={cursorStyle}
      className={treeColor(current)}
      r={radius}
      strokeWidth={strokeWidth}
    />
  );

  // let backboneBundleNodes = findBackboneBundleNodes(nodeMap, bundleMap)

  let dropDownAdded = false;

  if (eventConfig) {
    const eventType = node.metadata.type;
    if (eventType && eventType in eventConfig && eventType !== "Root") {
      const { bundleGlyph, currentGlyph, backboneGlyph } = eventConfig[
        eventType
      ];
      if (bundleMap && Object.keys(bundleMap).includes(node.id)) {
        dropDownAdded = true;
        glyph = (
          <g style={cursorStyle} fontWeight={"none"}>
            {bundleGlyph}
          </g>
        );
      }
      if (current) {
        glyph = (
          <g style={cursorStyle} fontWeight={"none"}>
            {currentGlyph}
          </g>
        );
      } else if (!dropDownAdded) {
        glyph = (
          <g style={cursorStyle} fontWeight={"none"}>
            {backboneGlyph}
          </g>
        );
      }
    }
  }

  let label: string = "";
  let annotate: string = "";

  //console.log(nodeMap[node.id]);

  if (bundleMap && Object.keys(bundleMap).includes(node.id) && node.ephemeral && expandedClusterList && !expandedClusterList.includes(node.id))
  {
    if(node.metadata && node.metadata.type)
    {
      label = "[" + bundleMap[node.id].bunchedNodes.length + "] " + node.metadata.type
    }
    else{
      label = "[" + bundleMap[node.id].bunchedNodes.length + "]"
    }
  }
  else{
    label = node.label;
  }

  if (node.artifacts && node.artifacts.annotation && node.artifacts.annotation.length > 0) {
    annotate = node.artifacts.annotation;
  }


  if (!nodeMap[node.id]) {
    return null;
  }

  if (annotate.length > 20) annotate = annotate.substr(0, 20) + "..";

  if (label.length > 20) label = label.substr(0, 20) + "..";

  // text should always be on the right side of the cellsVis
  // @ts-ignore
  if(node.state.model.cells != null){
    // @ts-ignore
    padding += ((cellsVisArea ? Math.sqrt(cellsVisArea) : Math.sqrt(15) )+6)*node.state.model.cells.length;
  }
  let labelG = (
    <g style={{ opacity: 1 }} transform={translate(padding, 0)}>
      {!iconOnly ? (
        <g>
          {dropDownAdded ? (
            <text
              style={cursorStyle}
              onClick={(e) => nodeClicked(node, e)}
              fontSize={17}
              fill={"rgb(248, 191, 132)"}
              textAnchor="middle"
              alignmentBaseline="middle"
              x={1}
              y={0}
              fontFamily="FontAwesome"
            >
              {expandedClusterList && expandedClusterList.includes(node.id)
                ? "\uf0d8"
                : "\uf0d7"}
            </text>
          ) : (
            <g></g>
          )}
          {editAnnotations ? (
            <button
             ><i className="fas fa-undo marginRight"></i>
               Undo</button>
          ) : (
            <g></g>
          )}
          <text
            y={annotate.length === 0 ? 0 : -7}
            x={dropDownAdded ? 10 : 0}
            dominantBaseline="middle"
            textAnchor="start"
            fontSize={textSize}
            fontWeight={"bold"}
            onClick={() => labelClicked(node)}
          >
            {label}
          </text>
          ,
          <text
            y={7}
            x={dropDownAdded ? 10 : 0}
            dominantBaseline="middle"
            textAnchor="start"
            fontSize={textSize}
            fontWeight={"regular"}
            onClick={() => labelClicked(node)}
          >
            {annotate}
          </text>
          ,
          <text
            style={cursorStyle}
            onClick={(e) => {
              if(prov)
              {
                prov.setBookmark(node.id, !prov.getBookmark(node.id));
                setBookmark(!bookmark);
              }

              e.stopPropagation();
            }}
            fontSize={17}
            fill={(prov && prov.getBookmark(node.id)) ? "#2185d0" : "#cccccc"}
            textAnchor="middle"
            alignmentBaseline="middle"
            x={175}
            y={0}
            fontFamily="FontAwesome"
          >
            {"\uf02e"}
          </text>
        </g>
      ) : (
        <g>
          {dropDownAdded ? (
            <text
              style={cursorStyle}
              onClick={(e) => nodeClicked(node, e)}
              fontSize={17}
              fill={"rgb(248, 191, 132)"}
              textAnchor="middle"
              alignmentBaseline="middle"
              x={1}
              y={0}
              fontFamily="FontAwesome"
            >
              {expandedClusterList && expandedClusterList.includes(node.id)
                ? "\uf0d8"
                : "\uf0d7"}
            </text>
          ) : (
            <g></g>
          )}
        </g>
      )}

      {annotationOpen !== -1 &&
      nodeMap[node.id].depth === annotationOpen &&
      annotationContent ? (
        <g>{annotationContent(nodeMap[node.id])}</g>
      ) : (
        <g></g>
      )}
    </g>
  );

  return (
    <Animate
      start={{ opacity: 0 }}
      enter={{
        opacity: [1],
        timing: { duration: 100, delay: first ? 0 : duration },
      }}
    >
      {(state) => (
        <>
          {popupContent !== undefined && nodeMap[node.id].depth > 0 ? (
            <Popup content={popupContent(node)} trigger={glyph} />
          ) : (
            glyph
          )}
          {/* {glyph} */}

          {popupContent !== undefined && nodeMap[node.id].depth > 0 ? (
            <Popup content={popupContent(node)} trigger={labelG} />
          ) : (
            labelG
          )}

          {
            <CellsVis/>
          }
        </>
      )}
    </Animate>
  );

  function labelClicked(node: ProvenanceNode<T, S, A>) {
    if (!annotationContent) {
      return;
    } else if (annotationOpen === nodeMap[node.id].depth) {
      setAnnotationOpen(-1);
    } else {
      setAnnotationOpen(nodeMap[node.id].depth);
    }
  }

  function nodeClicked(node: ProvenanceNode<T, S, A>, event: any) {
    if (bundleMap && Object.keys(bundleMap).includes(node.id)) {
      let exemptCopy: string[] = Array.from(exemptList);

      if (exemptCopy.includes(node.id)) {
        exemptCopy.splice(
          exemptCopy.findIndex((d) => d === node.id),
          1
        );
      } else {
        exemptCopy.push(node.id);
      }

      setExemptList(exemptCopy);
    }
    event.stopPropagation();
  }

  // ------------- np_jupyterlab
  function CellsVis() {
    let cellsVis;
    let squareSideLength = cellsVisArea ? Math.sqrt(cellsVisArea) : Math.sqrt(15);
    let xLength = (squareSideLength + 6);
        // @ts-ignore
    if (node.state.model.cells != null) {
      // @ts-ignore
      let nodeExtra: {cellPositions: Array<number>,changedCellId: number} = prov.getExtraFromArtifact(node.id)[0].e;
      // @ts-ignore
      cellsVis = node.state.model.cells.map((cell, index) =>
        <g key={index}
           transform={translate(20 + xLength * index, 0)}>
          <path
            strokeWidth={2}
            className={symbolColor(cell, index)}
            d={symbol().type(symbolSquare).size(cellsVisArea ? cellsVisArea : 15)()!}
          />
          <CellsLine yLength={squareSideLength/2} xLength={xLength} index={index} nodeExtra={nodeExtra}/>
        </g>);
    }
    // @ts-ignore
    if (node.state.model.cells != null) {
      return <g>
        {cellsVis}
      </g>;
    }
    return null;
  }

  interface CellsLineProps {
    yLength: number,
    xLength: number,
    index: number,
    nodeExtra: {
      cellPositions: Array<number>,
      changedCellId: number
    }
  }

  function CellsLine({
    yLength,
    xLength,
    index,
    nodeExtra
  }: CellsLineProps){
    let cellPositions = nodeExtra.cellPositions;
    if(cellPositions != null){ // cell added or moved
      // @ts-ignore
      if(cellPositions.length == node.state.model.cells.length-1) { // some cell was added
        // @ts-ignore
        if (cellPositions[index] == nodeExtra.changedCellId || cellPositions[index] == undefined) { // this is the new cell, undefined if on rightmost side
          return null;
        }
      }
      // @ts-ignore
      if(cellPositions.length == node.state.model.cells.length+1) { // some cell was removed
        if(cellPositions[index] == index) { // this cell didnt change position
          return <line
            x1="0"
            y1={-yLength}
            x2="0"
            y2={-yOffset+yLength}
            strokeWidth={2}
            stroke="rgb(0,0,0)"/>
        }else{
          return <line
            x1="0"
            y1={-yLength}
            x2={1 * xLength}
            y2={-yOffset+yLength}
            strokeWidth={2}
            stroke="rgb(0,0,0)"/>
        }
      }
      if(cellPositions[index] == index){ // this cell didnt change position
        return <line
          x1="0"
          y1={-yLength}
          x2="0"
          y2={-yOffset+yLength}
          strokeWidth={2}
          stroke="rgb(0,0,0)"/>
      }else{ // this cell changed position
        return <line
          x1={(cellPositions[index]-index) * xLength}
          y1={-yLength}
          x2="0"
          y2={-yOffset+yLength}
          strokeWidth={2}
          stroke="rgb(0,0,0)"/>
      }
    }

    // If no cellPositions info exists, then no cell has been added and no cell has been moved ==> just draw a line straight up
    return <line
      x1="0"
      y1={-yLength}
      x2="0"
      y2={-yOffset+yLength}
      strokeWidth={2}
      stroke="rgb(0,0,0)"/>

  }

  function symbolColor(cell: { cell_type?: any; }, index: number){
      switch (cell.cell_type) {
        case "code": {
          return style({
            // @ts-ignore
            fill: prov.getExtraFromArtifact(node.id)[0].e.changedCellId == index ? 'rgb(150, 22, 22)' : 'white',
            stroke: 'rgb(150, 22, 22)'
          });
          break;
        }
        case "markdown": {
          return style({
            // @ts-ignore
            fill: prov.getExtraFromArtifact(node.id)[0].e.changedCellId == index ? 'rgb(22, 150, 22)' : 'white',
            stroke: 'rgb(22, 150, 22)'
          });
          break;
        }
        case "raw": {
          return style({
            // @ts-ignore
            fill: prov.getExtraFromArtifact(node.id)[0].e.changedCellId == index ? 'rgb(22, 22, 150)' : 'white',
            stroke: 'rgb(22, 22, 150)'
          });
          break;
        }
      }
    }
}

export default BackboneNode;
