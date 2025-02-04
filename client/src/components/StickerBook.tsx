import { useEffect, useRef, useState } from "react";
import { Matrix2d } from "../math/matrix";
import StickerDeleteModal from "./StickerDeleteModal";
import "./StickerBook.css";

import DeleteImg from "../assets/delete.png";
import MoveImg from "../assets/move.png";
import RemoveImg from "../assets/remove.png";
import RotateImg from "../assets/refresh.png";
import UploadImg from "../assets/upload.png";
import SaveImg from "../assets/save.png";

interface StickerJSON {
  id: number;
  img: string;
  name: string;
  positions: PositionJSON[];
}

interface PositionJSON {
  id: number;
  matrix: string;
}

interface Sticker {
  id: number;
  img: string;
  name: string;
  positions: Position[];
}

interface Position {
  id: number;
  matrix: Matrix2d;
  xt: number;
  yt: number;
  deleted: boolean;
}

interface Vector {
  x: number;
  y: number;
}

type StatusMessage =
  | "Loading..."
  | ""
  | "Saving..."
  | "Saved."
  | "Loaded."
  | "Deleting..."
  | "Uploading...";

const STICKERS_URI = "http://127.0.0.1:5000/stickers";
const POSITIONS_URI = "http://127.0.0.1:5000/positions";

const REMOVE = -3;
const MOVE = -2;
const ROTATE = -1;

const STICKER_BOUNDS = 80;
const MESSAGE_TIMEOUT = 3000;

const StickerBook = () => {
  const handleResponse = (response: StickerJSON[]) => {
    const newStickers: Sticker[] = [];

    for (const sticker of response) {
      const newPositions: Position[] = [];

      for (const position of sticker.positions) {
        const matrixEntries = position.matrix.split(",");

        newPositions.push({
          id: position.id,
          matrix: new Matrix2d(position.matrix),
          xt: parseInt(matrixEntries[4]),
          yt: parseInt(matrixEntries[5]),
          deleted: false,
        });
      }

      newStickers.push({
        id: sticker.id,
        img: sticker.img,
        name: sticker.name,
        positions: newPositions,
      });
    }

    setStickers(newStickers);

    setStatusMessage("Loaded.");

    setTimeout(() => setStatusMessage(""), MESSAGE_TIMEOUT);
  };

  const handleSaveClicked = () => {
    setStatusMessage("Saving...");

    for (const sticker of stickers) {
      for (const position of sticker.positions) {
        let positionJson: PositionJSON = {
          id: position.id,
          matrix: [
            position.matrix.toString(),
            ",",
            position.xt.toString(),
            ",",
            position.yt.toString(),
          ].join(""),
        };

        if (position.deleted) {
          if (position.id !== -1) {
            fetch(`${POSITIONS_URI}/${position.id}`, {
              method: "DELETE",
            });
          }
        } else if (positionJson.id === -1) {
          fetch(POSITIONS_URI, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              matrix: positionJson.matrix,
              sticker_id: sticker.id,
            }),
          });
        } else {
          fetch(`${POSITIONS_URI}/${positionJson.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              matrix: positionJson.matrix,
            }),
          });
        }
      }
    }

    setStatusMessage("Saved.");

    setTimeout(() => setStatusMessage(""), MESSAGE_TIMEOUT);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files === null) {
      return;
    }

    const data = new FormData();
    data.append("img", e.target.files[0]);

    setStatusMessage("Uploading...");

    await fetch(STICKERS_URI, {
      method: "POST",
      body: data,
    });

    setStatusMessage("Loading...");

    fetch(STICKERS_URI, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(handleResponse);
  };

  const handleStickerPlaced = () => {
    if (cursorPosition.current === undefined) {
      return;
    }

    const newStickers = Array.from(stickers);
    newStickers[panelSelection].positions.push({
      id: -1,
      matrix: new Matrix2d("1,0,0,1"),
      xt: cursorPosition.current.x,
      yt: cursorPosition.current.y,
      deleted: false,
    });

    setStickers(newStickers);
  };

  const handleStickerClicked = (idxSticker: number, idxPos: number) => {
    if (interval.current !== -1) {
      return;
    }

    switch (panelSelection) {
      case MOVE:
        interval.current = setInterval(() => {
          if (cursorPosition.current !== undefined) {
            const newPosition = {
              id: stickers[idxSticker].positions[idxPos].id,
              matrix: stickers[idxSticker].positions[idxPos].matrix,
              xt: cursorPosition.current.x,
              yt: cursorPosition.current.y,
              deleted: false,
            };

            const newStickers = Array.from(stickers);
            newStickers[idxSticker].positions[idxPos] = newPosition;

            setStickers(newStickers);
          }
        }, 20);
        break;

      case ROTATE:
        interval.current = setInterval(() => {
          if (cursorPosition.current !== undefined) {
            const newPosition = {
              id: stickers[idxSticker].positions[idxPos].id,
              matrix: stickers[idxSticker].positions[idxPos].matrix,
              xt: stickers[idxSticker].positions[idxPos].xt,
              yt: stickers[idxSticker].positions[idxPos].yt,
              deleted: false,
            };

            if (newPosition.xt - cursorPosition.current.x > 0) {
              newPosition.matrix.rotate(2);
            }
            if (newPosition.xt - cursorPosition.current.x < 0) {
              newPosition.matrix.rotate(-2);
            }

            const newStickers = Array.from(stickers);
            newStickers[idxSticker].positions[idxPos] = newPosition;

            setStickers(newStickers);
          }
        }, 20);
        break;

      case REMOVE:
        const newPosition: Position = {
          id: stickers[idxSticker].positions[idxPos].id,
          matrix: stickers[idxSticker].positions[idxPos].matrix,
          xt: stickers[idxSticker].positions[idxPos].xt,
          yt: stickers[idxSticker].positions[idxPos].yt,
          deleted: true,
        };

        const newStickers = Array.from(stickers);
        newStickers[idxSticker].positions[idxPos] = newPosition;

        setStickers(stickers);
    }
  };

  const handleStickerDeletion = async () => {
    const marked = markedForDeletion;
    setMarkedForDeletion(-1);
    setStatusMessage("Deleting...");

    await fetch(`${STICKERS_URI}/${stickers[marked].id}`, {
      method: "DELETE",
    });

    setStatusMessage("Loading...");
    setPanelSelection(MOVE);

    await fetch(STICKERS_URI, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(handleResponse);

    setStatusMessage("Loaded.");

    setTimeout(() => setStatusMessage(""), MESSAGE_TIMEOUT);
  };

  useEffect(() => {
    const mouseMoveListener: EventListener = (e: MouseEventInit) => {
      const rect = document
        .getElementById("sticker-area")
        ?.getBoundingClientRect();

      if (
        rect === undefined ||
        e.clientX === undefined ||
        e.clientY === undefined
      ) {
        return;
      }

      if (
        e.clientX >= rect.left &&
        e.clientY >= rect.top &&
        e.clientX <= rect.right &&
        e.clientY <= rect.bottom
      ) {
        const offset = STICKER_BOUNDS / 2;
        cursorPosition.current = {
          x: e.clientX - offset,
          y: e.clientY - offset,
        };

        setStampPosition(cursorPosition.current);
      } else {
        clearInterval(interval.current);
        interval.current = -1;
        cursorPosition.current = undefined;
        setStampPosition(undefined);
      }
    };

    const mouseUpListener: EventListener = () => {
      clearInterval(interval.current);
      interval.current = -1;
    };

    document.addEventListener("mousemove", mouseMoveListener);
    document.addEventListener("mouseup", mouseUpListener);

    return () => {
      document.removeEventListener("mousemove", mouseMoveListener);
      document.removeEventListener("mouseup", mouseUpListener);
    };
  });

  useEffect(() => {
    fetch(STICKERS_URI, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(handleResponse);
  }, []);

  const interval = useRef<number>(-1);

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [panelSelection, setPanelSelection] = useState<number>(0);
  const [stampPosition, setStampPosition] = useState<Vector | undefined>(
    undefined
  );
  const [markedForDeletion, setMarkedForDeletion] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>("");

  const cursorPosition = useRef<Vector | undefined>(undefined);

  return (
    <div className="flex">
      {stampPosition &&
        panelSelection >= 0 &&
        stickers[panelSelection] !== undefined && (
          <img
            id="stamper"
            className={`absolute w-[${STICKER_BOUNDS}px] h-[${STICKER_BOUNDS}px] opacity-40 `}
            style={{
              top: `${stampPosition.y}px`,
              left: `${stampPosition.x}px`,
            }}
            src={stickers[panelSelection].img}
            onClick={handleStickerPlaced}
          />
        )}
      <div
        id="sticker-area"
        className=" w-[1000px] h-[800px] ml-6 mt-6 bg-amber-100 border-dark-brown border-solid border-[3px] rounded-xl"
      >
        <p className="ml-2">{statusMessage}</p>
        {stickers.map((sticker, j) =>
          sticker.positions.map(
            (position, i) =>
              !position.deleted && (
                <img
                  className={`absolute left-0 top-0 w-[${STICKER_BOUNDS}px] h-[${STICKER_BOUNDS}px]`}
                  style={{
                    transform: `matrix(
                  ${position.matrix.toString()},
                  ${position.xt},
                  ${position.yt}
                )`,
                  }}
                  key={`${sticker.name}-${i}`}
                  src={sticker.img}
                  draggable={false}
                  onMouseDown={() => handleStickerClicked(j, i)}
                />
              )
          )
        )}
      </div>
      <div className="bg-dark-brown p-3 ml-3 rounded-3xl mt-3">
        <div className="grid grid-cols-5 p-3 gap-2">
          <div
            className={
              panelSelection === MOVE
                ? "w-[80px] h-[80px] bg-light-brown border-dashed border-black border-[3px] rounded-xl p-3"
                : "w-[80px] h-[80px] bg-light-brown rounded-xl p-3"
            }
            onClick={() => setPanelSelection(MOVE)}
          >
            <img className="flex justify-center items-center" src={MoveImg} />
          </div>
          <div
            className={
              panelSelection === ROTATE
                ? "w-[80px] h-[80px] bg-light-brown border-dashed border-black border-[3px] rounded-xl p-5"
                : "w-[80px] h-[80px] bg-light-brown rounded-xl p-5"
            }
            onClick={() => setPanelSelection(ROTATE)}
          >
            <img className="flex justify-center items-center" src={RotateImg} />
          </div>
          <div
            className={
              panelSelection === REMOVE
                ? "w-[80px] h-[80px] bg-light-brown border-dashed border-black border-[3px] rounded-xl p-5"
                : "w-[80px] h-[80px] bg-light-brown rounded-xl p-5"
            }
            onClick={() => setPanelSelection(REMOVE)}
          >
            <img className="flex justify-center items-center" src={RemoveImg} />
          </div>
          <div className="w-[80px] h-[80px] bg-light-brown rounded-xl p-2">
            <img className="flex justify-center items-center" src={UploadImg} />
            <input
              className="block h-[80px] w-[80px] mt-[-80px] absolute cursor-pointer opacity-0"
              type="file"
              accept="jpg,.jpeg,.png"
              onChange={handleImageUpload}
            />
          </div>

          <div
            className="w-[80px] h-[80px] bg-light-brown cursor-pointer rounded-xl p-4"
            onClick={handleSaveClicked}
          >
            <img className="flex justify-center items-center" src={SaveImg} />
          </div>
        </div>
        <div className="h-[700px] p-2 bg-amber-100 rounded-3xl overflow-y-auto">
          <div className="grid grid-cols-5 p-3 gap-2">
            {stickers.map((sticker, i) => (
              <div
                key={`${sticker.name}`}
                className={
                  panelSelection === i
                    ? `w-[${STICKER_BOUNDS}px] h-[${STICKER_BOUNDS}px] border-dashed border-black border-[3px]`
                    : `w-[${STICKER_BOUNDS}px] h-[${STICKER_BOUNDS}px]`
                }
                onClick={() => setPanelSelection(i)}
              >
                <img
                  key={`${sticker.name}-img`}
                  src={sticker.img}
                  className={`w-[${STICKER_BOUNDS}px] h-[${STICKER_BOUNDS}px]`}
                />
                <img
                  key={`${sticker.name}-delete`}
                  src={DeleteImg}
                  className={`w-[20px] h-auto mt-[-${STICKER_BOUNDS}px] float-right cursor-pointer`}
                  onClick={() => setMarkedForDeletion(i)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {markedForDeletion !== -1 && (
        <StickerDeleteModal
          onOK={handleStickerDeletion}
          onCancel={() => setMarkedForDeletion(-1)}
        />
      )}
    </div>
  );
};

export default StickerBook;
