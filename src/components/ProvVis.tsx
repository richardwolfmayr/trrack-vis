
import { Provenance, isStateNode, isChildNode, NodeID, Nodes, ProvenanceGraph, ProvenanceNode, StateNode, ChildNode, DiffNode } from '@visdesignlab/trrack';
import { HierarchyNode, stratify, Symbol, symbol, symbolWye, symbolCross, symbolCircle, symbolTriangle, symbolSquare, symbolDiamond, symbolStar } from 'd3';

import React, { ReactChild, useEffect, useState } from 'react';
import { NodeGroup } from 'react-move';
import {CheckboxProps, Popup} from 'semantic-ui-react';
import { style } from 'typestyle';

import { BundleMap } from '../Utils/BundleMap';
import { EventConfig } from '../Utils/EventConfig';
import findBundleParent from '../Utils/findBundleParent';
import translate from '../Utils/translate';

import UndoRedoButton from "./UndoRedoButton"
import { treeLayout } from '../Utils/TreeLayout';
import BackboneNode from './BackboneNode';
import bundleTransitions from './BundleTransitions';
import Link from './Link';
import linkTransitions from './LinkTransitions';
import nodeTransitions from './NodeTransitions';
import { treeColor } from './Styles';
import {Legend} from "./Legend";

interface ProvVisProps<T, S extends string, A> {
  root: NodeID;
  sideOffset?: number;
  iconOnly?: boolean;
  current: NodeID;
  nodeMap: Nodes<T, S, A>;
  backboneGutter?: number;
  gutter?: number;
  verticalSpace?: number;
  annotationHeight?: number;
  clusterVerticalSpace?: number;
  regularCircleRadius?: number;
  backboneCircleRadius?: number;
  regularCircleStroke?: number;
  backboneCircleStroke?: number;
  topOffset?: number;
  textSize?: number;
  height?: number;
  width?: number;
  linkWidth?: number;
  duration?: number;
  clusterLabels?: boolean;
  bundleMap?: BundleMap;
  eventConfig?: EventConfig<S>;
  changeCurrent?: (id: NodeID) => void;
  popupContent?: (nodeId: StateNode<T, S, A>) => ReactChild;
  annotationContent?: (nodeId: StateNode<T, S, A>) => ReactChild;
  undoRedoButtons?: boolean;
  editAnnotations?: boolean
  prov?: Provenance<T, S, A>;
  ephemeralUndo?: boolean;
  cellsVisArea?: number;
  legend?: boolean;
  filters?: boolean;
}

export type StratifiedMap<T, S, A> = {
  [key: string]: HierarchyNode<ProvenanceNode<T, S, A>>;
};

export type StratifiedList<T, S, A> = HierarchyNode<ProvenanceNode<T, S, A>>[];

function ProvVis<T, S extends string, A>({
  nodeMap,
  root,
  current,
  changeCurrent,
  width = 1500,
  height = 2000,
  iconOnly = false,
  gutter = 15,
  backboneGutter = 20,
  verticalSpace = 50,
  annotationHeight = 100,
  clusterVerticalSpace = 50,
  regularCircleRadius = 4,
  backboneCircleRadius = 5,
  regularCircleStroke = 3,
  backboneCircleStroke = 3,
  sideOffset = 200,
  topOffset = 30,
  textSize = 15,
  linkWidth = 4,
  duration = 600,
  clusterLabels = true,
  bundleMap = {},
  eventConfig,
  popupContent,
  annotationContent,
  editAnnotations = false,
  undoRedoButtons = true,
  prov,
  ephemeralUndo = false,
  cellsVisArea = 50,
  legend = false,
  filters = false
}: ProvVisProps<T, S, A>) {
  const [first, setFirst] = useState(true);
  const [bookmark, setBookmark] = useState(false);
  const [annotationOpen, setAnnotationOpen] = useState(-1);
  let list: string[] = [];
  let eventTypes = new Set<string>();
  for(let j in nodeMap)
  {
    let child = nodeMap[j]
    if(isChildNode(child))
    {
      if(child.metadata.type)
      {
        eventTypes.add(child.metadata.type);
      }

      if(child.ephemeral && child.children.length == 1 && (!nodeMap[child.parent].ephemeral || nodeMap[child.parent].children.length > 1))
      {
        let group:string[] = [];
        let curr = child;
        while(curr.ephemeral)
        {
          group.push(curr.id)
          if(curr.children.length === 1 && nodeMap[curr.children[0]].ephemeral)
          {
            curr = nodeMap[curr.children[0]] as DiffNode<T, S, A>;
          }
          else{
            break;
          }
        }

        bundleMap[child.id] = {
          metadata: "",
          bundleLabel: "",
          bunchedNodes: group
        }
      }

    }
  }

  if(bundleMap)
  {
    list = list.concat(Object.keys(bundleMap));
  }

  function setDefaultConfig<E extends string>(types:Set<string>): EventConfig<E> {
    let symbols = [
      symbol().type(symbolStar).size(50),
      symbol().type(symbolDiamond),
      symbol().type(symbolTriangle),
      symbol().type(symbolCircle),
      symbol().type(symbolCross),
      symbol().type(symbolSquare),
      symbol().type(symbolWye)
    ]

    // Find nodes in the clusters whose entire cluster is on the backbone.
    let conf: EventConfig<E> = {}
    let counter = 0;

    for(let j of types)
    {
      conf[j] = {}
      conf[j].backboneGlyph = (
        <path
          strokeWidth={2}
          className={treeColor(false)}
          d={symbols[counter]()!}
        />
      )

      conf[j].bundleGlyph = (
        <path
          strokeWidth={2}
          className={treeColor(false)}
          d={symbols[counter]()!}
        />
      )

      conf[j].currentGlyph = (
        <path
          strokeWidth={2}
          className={treeColor(true)}
          d={symbols[counter]()!}
        />
      )

      conf[j].regularGlyph = (
        <path
          strokeWidth={2}
          className={treeColor(false)}
          d={symbols[counter]()!}
        />
      )

      counter++;
    }

    return conf;
  }


  const [expandedClusterList, setExpandedClusterList] = useState<string[]>(Object.keys(bundleMap));



  if(!eventConfig && eventTypes.size > 0 && eventTypes.size < 8)
  {
    eventConfig = setDefaultConfig<S>(eventTypes);
  }


  useEffect(() => {
    setFirst(false);
  }, []);


  // Apply user filters:
  let typeFilters: Array<string> = new Array();
  eventTypes.forEach(type => {
    let id = type+" checkbox";
    let checkbox = document.getElementById(id);
    // @ts-ignore
    if(checkbox && checkbox.checked){
      typeFilters.push(type);
    }
  });



  let removeList: Array<string> = [];
  recursiveRemoveFiltered(nodeMap[root]);

  // Go through the whole tree and remove nodes that have been filtered out by user settings.
  function recursiveRemoveFiltered(node: ProvenanceNode<T, S, A>, parentNode?: ProvenanceNode<T, S, A>){
    // node that needs to be removed:
    if(isChildNode(node) && node.metadata && node.metadata.type && typeFilters.includes(node.metadata.type)){
      // remove the node from the parents children and from the nodeList
      if(node.parent && parentNode && parentNode.children){
        // remove from parent if exists there
        if(parentNode.children.includes(node.id)){
          parentNode.children.splice(parentNode.children.indexOf(node.id),1);
        }
        // remove from nodeList... this is done with the filter methode when initialising nodeList later on, but here I set the condition
        removeList.push(node.id);
      }
      node.children.forEach(n => {
        let child = nodeMap[n];
        if(isChildNode(node) && node.parent && parentNode && parentNode.children){
          if(isChildNode(child)){ // for sure it is a child, but I check here because typescript does not know
            child.parent = parentNode.id;
          }
          // parentNode.children.push(n)
          recursiveRemoveFiltered(child,parentNode); // the parent stays the parent of this node, since this one is removed
        }
      });
    }else{ // node that will not be removed
      // if node was already child of parentNode: no problem, if not: add it
      if(parentNode && !parentNode.children.includes(node.id)){
        parentNode.children.push(node.id);
      }
      if(node.children){
        node.children.forEach(n => {
          let child = nodeMap[n];
          recursiveRemoveFiltered(child,node); // the parent is THIS node, not the parent node of this node
        });
      }
    }
  }

  let nodeList = Object.values(nodeMap).filter(
    (d) => !removeList.includes(d.id)
  );

  let filteredBundleMap: BundleMap = {};
  for(let key in bundleMap){
    if(!removeList.includes(key)){
      filteredBundleMap[key] = bundleMap[key];
    }
  }

  let copyList = Array.from(nodeList);

  const keys = filteredBundleMap ? Object.keys(filteredBundleMap) : [];

  //Find a list of all nodes included in a bundle.
  let bundledNodes: string[] = [];

  if (filteredBundleMap) {
    for (let key of keys) {
      bundledNodes = bundledNodes.concat(filteredBundleMap[key].bunchedNodes);
      bundledNodes.push(key);
    }
  }

  const strat = stratify<ProvenanceNode<T, S, A>>()
    .id((d) => d.id)
    .parentId((d) => {
      if (d.id === root) return null;

      if (isChildNode(d)) {
        //If you are a unexpanded bundle, find your parent by going straight up.
        if (
          filteredBundleMap &&
          Object.keys(filteredBundleMap).includes(d.id) &&
          !expandedClusterList.includes(d.id)
        ) {
          let curr = d;

          while (true) {
            //need this to remove linter warning.
            let localCurr = curr;
            // let bundlePar = findBundleParent(curr.parent, filteredBundleMap);
            // if(bundlePar.length > 0)
            // {
            //   for(let j in bundlePar)
            //   {
            //     if(bundlePar[j] != d.id && !expandedClusterList.includes(bundlePar[j]))
            //     {
            //       return bundlePar[j];
            //     }
            //   }
            // }

            if (
              !bundledNodes.includes(localCurr.parent) ||
              Object.keys(filteredBundleMap).includes(localCurr.parent)
            ) {
              return localCurr.parent;
            }

            let temp = copyList.filter(function(d) {
              return d.id === localCurr.parent;
            })[0];

            if (isChildNode(temp)) {
              curr = temp;
            }
          }
        }

        let bundleParents = findBundleParent(d.parent, filteredBundleMap);
        let collapsedParent = undefined;

        let allExpanded = true;

        for (let j in bundleParents) {
          if (!expandedClusterList.includes(bundleParents[j])) {
            allExpanded = false;
            collapsedParent = bundleParents[j];
            break;
          }
        }

        if (
          bundledNodes.includes(d.parent) &&
          filteredBundleMap &&
          !Object.keys(filteredBundleMap).includes(d.parent) &&
          !allExpanded
        ) {
          return collapsedParent;
        }

        return d.parent;
      } else {
        return null;
      }
    });

  for (let i = 0; i < nodeList.length; i++) {
    let bundleParents = findBundleParent(nodeList[i].id, filteredBundleMap);

    let allExpanded = true;

    for (let j in bundleParents) {
      if (!expandedClusterList.includes(bundleParents[j])) {
        allExpanded = false;
        break;
      }
    }

    if (
      bundledNodes.includes(nodeList[i].id) &&
      !allExpanded &&
      filteredBundleMap &&
      !Object.keys(filteredBundleMap).includes(nodeList[i].id)
    ) {
      nodeList.splice(i, 1);
      i--;
    }
  }

  const stratifiedTree = strat(nodeList);

  const stratifiedList: StratifiedList<T, S, A> = stratifiedTree.descendants();
  const stratifiedMap: StratifiedMap<T, S, A> = {};


  stratifiedList.forEach((c) => (stratifiedMap[c.id!] = c));
  treeLayout(stratifiedMap, current, root);

  let maxHeight = 0;
  let maxWidth = 0;

  for (let j in stratifiedList) {
    if (stratifiedList[j].depth > maxHeight) {
      maxHeight = stratifiedList[j].depth;
    }

    if ((stratifiedList[j] as any).width > maxWidth) {
      maxWidth = (stratifiedList[j] as any).width;
    }
  }

  maxHeight = maxHeight * verticalSpace + 200;

  const links = stratifiedTree.links();

  const xOffset = gutter;
  const yOffset = verticalSpace;

  function regularGlyph(node: ProvenanceNode<T, S, A>) {
    if (eventConfig) {
      const eventType = node.metadata.type;
      if (
        eventType &&
        eventType in eventConfig &&
        eventType !== "Root" &&
        eventConfig[eventType].regularGlyph
      ) {
        return eventConfig[eventType].regularGlyph;
      }
    }
    return (
      <circle
        r={regularCircleRadius}
        strokeWidth={regularCircleStroke}
        className={treeColor(false)}
      />
    );
  }

  function bundleGlyph(node: ProvenanceNode<T, S, A>) {
    if (eventConfig) {
      const eventType = node.metadata.type;
      if (eventType && eventType in eventConfig && eventType !== "Root") {
        return eventConfig[eventType].bundleGlyph;
      }
    }
    return (
      <circle
        r={regularCircleRadius}
        strokeWidth={regularCircleStroke}
        className={treeColor(false)}
      />
    );
  }

  let shiftLeft = 0;



  // if (maxWidth === 0) {
  //   shiftLeft = 30;
  // } else if (maxWidth === 1) {
  //   shiftLeft = 52;
  // }
  // else if (maxWidth > 1) {
  //   shiftLeft = 74;
  // }
  if (maxWidth === 0) {
    shiftLeft = 30;
  } else {
    shiftLeft = 30 + maxWidth * 22;
  }



  let svgWidth = width;

  // if (document.getElementById("globalG") !== null) {
  //   if (
  //     document
  //       .getElementById("globalG")!
  //       .getBoundingClientRect()
  //       .width.valueOf() > svgWidth
  //   ) {
  //     console.log("in here");
  //     svgWidth =
  //       document
  //         .getElementById("globalG")!
  //         .getBoundingClientRect()
  //         .width.valueOf() + 10;
  //   }
  // }

  let overflowStyle = {
    overflowX: "auto",
    overflowY: "auto",
  } as React.CSSProperties;

  let undoRedoStickyStyle = {
    position: "sticky",
    top: 0
  } as React.CSSProperties;

  // let bundleRectPadding = (cellsVisArea ? Math.sqrt(cellsVisArea) : Math.sqrt(15)) * maxNumberOfCells; // the rectangular for the bundled nodes needs to be bigger because of the cells
  const cellsBundlePadding = (cellsVisArea ? Math.sqrt(cellsVisArea) : Math.sqrt(15)) + 6;

  return (
    <div>
      {legend &&
        <Legend
          filters={filters}
          eventConfig={eventConfig}
          iconHeight={25}
          iconWidth={25}
        />
      }
      <div id="undoRedoDiv" style={undoRedoStickyStyle}>
        <UndoRedoButton
          graph={prov ? prov.graph() : undefined}
          undoCallback = {() => {
            if(prov)
            {
              if(ephemeralUndo)
              {
                prov.goBackToNonEphemeral()
              }
              else{
                prov.goBackOneStep();
              }
            }
            else{
              return;
            }
          }}
          redoCallback = {() => {
            if(prov)
            {
              if(ephemeralUndo)
              {
                prov.goForwardToNonEphemeral()
              }
              else{
                prov.goForwardOneStep();
              }
            }
            else{
              return;
            }
          }}
        />
      </div>
      <div style={overflowStyle} className={container} id="prov-vis">
        <svg
          style={{ overflow: "visible" }}
          id={"topSvg"}
          height={maxHeight < height ? height : maxHeight}
          width={svgWidth}
        >
          <rect height={height} width={width} fill="none" stroke="none" />
          <g id={"globalG"} transform={translate(shiftLeft, topOffset)}>
            <NodeGroup
              data={links}
              keyAccessor={(link) => `${link.source.id}${link.target.id}`}
              {...linkTransitions(
                xOffset,
                yOffset,
                clusterVerticalSpace,
                backboneGutter - gutter,
                duration,
                stratifiedList,
                stratifiedMap,
                annotationOpen,
                annotationHeight,
                filteredBundleMap
              )}
            >
              {(linkArr) => (
                <>
                  {linkArr.map((link) => {
                    const { key, state } = link;
                    // console.log(linkArr);
                    return (
                      <g key={key}>
                        <Link
                          {...state}
                          fill={'#ccc'}
                          stroke={'#ccc'}
                          strokeWidth={linkWidth}
                        />
                      </g>
                    );
                  })}
                </>
              )}
            </NodeGroup>
            <NodeGroup
              data={stratifiedList}
              keyAccessor={(d) => d.id}

              {...nodeTransitions(
                xOffset,
                yOffset,
                clusterVerticalSpace,
                backboneGutter - gutter,
                duration,
                stratifiedList,
                stratifiedMap,
                annotationOpen,
                annotationHeight,
                filteredBundleMap
              )}
            >
              {(nodes) => {
                return (
                  <>
                    {nodes.map((node) => {
                      const { data: d, key, state } = node;
                      const popupTrigger = (
                        <g
                          key={key}
                          onClick={() => {
                            if (changeCurrent) {
                              changeCurrent(d.id);
                            }
                          }}
                          transform={
                            d.width === 0
                              ? translate(state.x, state.y)
                              : translate(state.x, state.y)
                          }
                        >
                          {d.width === 0 ? (
                            <BackboneNode
                              prov={prov}
                              textSize={textSize}
                              iconOnly={iconOnly}
                              radius={backboneCircleRadius}
                              strokeWidth={backboneCircleStroke}
                              duration={duration}
                              first={first}
                              current={current === d.id}
                              node={d.data}
                              setBookmark={setBookmark}
                              bookmark={bookmark}
                              bundleMap={filteredBundleMap}
                              nodeMap={stratifiedMap}
                              clusterLabels={clusterLabels}
                              annotationOpen={annotationOpen}
                              setAnnotationOpen={setAnnotationOpen}
                              exemptList={expandedClusterList}
                              editAnnotations={editAnnotations}
                              setExemptList={setExpandedClusterList}
                              eventConfig={eventConfig}
                              annotationContent={annotationContent}
                              popupContent={popupContent}
                              expandedClusterList={expandedClusterList}
                              cellsVisArea={cellsVisArea}
                              yOffset={yOffset}
                            />
                          ) : popupContent !== undefined ? (
                            <Popup
                              content={popupContent(d.data)}
                              trigger={
                                <g
                                  onClick={() => {
                                    setAnnotationOpen(-1);
                                  }}
                                >
                                  {keys.includes(d.id)
                                    ? bundleGlyph(d.data)
                                    : regularGlyph(d.data)}
                                </g>
                              }
                            />

                          ) : (
                            <g
                              onClick={() => {
                                setAnnotationOpen(-1);
                              }}
                            >
                              {regularGlyph(d.data)}
                            </g>
                          )}
                        </g>
                      );

                      return popupTrigger;
                    })}
                  </>
                );
              }}
            </NodeGroup>
            <NodeGroup
              data={keys}
              keyAccessor={(key) => `${key}`}
              {...bundleTransitions(
                xOffset,
                verticalSpace,
                clusterVerticalSpace,
                backboneGutter - gutter,
                duration,
                expandedClusterList,
                stratifiedMap,
                stratifiedList,
                annotationOpen,
                annotationHeight,
                filteredBundleMap
              )}
            >
              {(bundle) => (
                <>
                  {bundle.map((b) => {
                    const { key, state } = b;
                    if (
                      filteredBundleMap === undefined ||
                      stratifiedMap[b.key] === undefined ||
                      (stratifiedMap[b.key] as any).width !== 0 ||
                      state.validity === false
                    ) {
                      return null;
                    }
                    // @ts-ignore
                    let bundleRectPadding = stratifiedMap[b.key].data.state.model.cells.length * cellsBundlePadding;
                    return (
                      <g
                        key={key}
                        transform={translate(
                          state.x - gutter + 5,
                          state.y - clusterVerticalSpace / 2
                        )}
                      >
                        <rect
                          style={{ opacity: state.opacity }}
                          width={(iconOnly ? 42 : sideOffset - 15) + bundleRectPadding + 5}
                          height={state.height}
                          rx="10"
                          ry="10"
                          fill="none"
                          strokeWidth="2px"
                          stroke="rgb(248, 191, 132)"
                        ></rect>
                      </g>
                    );
                  })}
                </>
              )}
            </NodeGroup>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default ProvVis;

const container = style({
  alignItems: "center",
  justifyContent: "center",
  overflow: "auto",
});
