import { useEffect } from "react";
import WarningImg from "../assets/warning.png";

interface StickerDeleteModalProps {
  onCancel: () => void;
  onOK: () => void;
}

const StickerDeleteModal = ({ onOK, onCancel }: StickerDeleteModalProps) => {
  useEffect(() => {
    const mouseClickedListener: EventListener = (e: MouseEventInit) => {
      const rect = document.getElementById("modal")?.getBoundingClientRect();

      if (
        rect === undefined ||
        e.clientX === undefined ||
        e.clientY === undefined
      ) {
        return;
      }

      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY > rect.bottom ||
        e.clientY < rect.top
      ) {
        onCancel();
      }
    };

    window.addEventListener("mousedown", mouseClickedListener);

    return () => window.removeEventListener("mousedown", mouseClickedListener);
  });

  return (
    <div className="min-w-full min-h-full absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-black bg-opacity-30">
      <div
        id="modal"
        className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-60%] bg-opacity-100"
      >
        <div className="w-[600px] h-80 bg-amber-100 border-solid border-dark-brown border-[3px] rounded-2xl pr-5 pt-14 pb-14">
          <div className="grid grid-cols-2 gap-1">
            <img
              className="w-[100px] h-auto justify-self-center self-center"
              src={WarningImg}
            />
            <p className="text-left self-center p-3 ml-[-44px] font-bold">
              Continuing this action will permanently remove the sticker and all
              instances of it from the sheet.
            </p>
          </div>
          <div className="flex h-[55%] w-[100%] items-end justify-center gap-x-24 pl-5">
            <div
              className="inline-flex bg-light-brown text-black p-3 px-10 cursor-pointer font-bold rounded-xl border-solid border-black border-[3px]"
              onClick={onOK}
            >
              OK
            </div>
            <div
              className="inline-flex bg-light-brown text-black p-3 px-7 cursor-pointer font-bold rounded-xl border-solid border-black border-[3px]"
              onClick={onCancel}
            >
              <p className="self-center">Cancel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerDeleteModal;
