import React, { Component, ReactNode } from "react";
import {
  DragDropContext,
  DragDropContextProps,
  Draggable,
  DraggableProvidedDraggableProps,
  Droppable,
} from "react-beautiful-dnd";
import "./style.css";

interface ClassNameArguments {
  readonly isDraggingOver?: boolean;
}

interface ChildClassArguments<T> {
  readonly child: T;
  readonly isDragging?: boolean;
}

export interface Props<T> {
  readonly children: (record: T, index: number) => ReactNode;
  readonly childClassName?: string | ((args: ChildClassArguments<T>) => string);
  readonly className?: string | ((args: ClassNameArguments) => string);
  readonly data: readonly T[];
  readonly isDragDisabled?: boolean;
  readonly isDropDisabled?: boolean;
  onDataReorder(newData: readonly T[]): void;
}

export default class WithDragAndDrop<T> extends Component<Props<T>> {
  public constructor(props: Props<T>) {
    super(props);
    this.reorder = this.reorder.bind(this);
  }

  private onDragEnd: DragDropContextProps["onDragEnd"] = (result) => {
    const sourceIndex = result?.source?.index ?? undefined;
    const destinationIndex = result?.destination?.index ?? undefined;
    if (sourceIndex === undefined || destinationIndex === undefined) return;
    const { data, onDataReorder } = this.props;
    const newData = this.reorder(data, sourceIndex, destinationIndex);
    onDataReorder(newData);
  };

  private getItemStyle = (
    draggableStyle: DraggableProvidedDraggableProps["style"]
  ) => ({
    userSelect: "none" as const,
    // styles we need to apply on draggables
    ...draggableStyle,
  });

  private reorder<T>(list: readonly T[], startIndex: number, endIndex: number) {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  renderView = () => {
    const {
      children,
      childClassName,
      className,
      data = [],
      isDragDisabled,
      isDropDisabled,
    } = this.props;

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable" isCombineEnabled={!!isDropDisabled}>
          {(
            { droppableProps, innerRef: droppableInnerRef, placeholder },
            { isDraggingOver }
          ) => (
            <div
              className={`
              dnd-parent
              ${!!isDraggingOver && "is-dragging-over"}
              ${
                className instanceof Function
                  ? className({ isDraggingOver })
                  : className
              }`}
              ref={droppableInnerRef}
              {...droppableProps}
            >
              {data.map((datum, i) => (
                <Draggable
                  key={i}
                  draggableId={`${i}`}
                  index={i}
                  isDragDisabled={!!isDragDisabled}
                >
                  {(
                    {
                      draggableProps,
                      dragHandleProps,
                      innerRef: draggableInnerRef,
                    },
                    { isDragging }
                  ) => (
                    <div
                      className={`
                      dnd-child 
                      ${
                        childClassName instanceof Function
                          ? childClassName({ isDragging, child: datum })
                          : childClassName
                      }
                      
                    `}
                      ref={draggableInnerRef}
                      {...draggableProps}
                      {...dragHandleProps}
                      style={this.getItemStyle(draggableProps.style)}
                    >
                      {children(datum, i)}
                    </div>
                  )}
                </Draggable>
              ))}
              {placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };
}
