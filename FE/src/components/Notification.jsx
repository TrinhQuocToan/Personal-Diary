import React from "react";
import { MdOutlineCancel } from "react-icons/md";

import { useStateContext } from "../contexts/ContextProvider";

const Notification = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-start pt-16">
      {/* Overlay để đóng modal khi click bên ngoài */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25"
        onClick={() => setIsClicked({ ...initialState, notification: false })}
      />
      <div className="nav-item relative right-5 md:right-40 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <p className="font-semibold text-lg dark:text-gray-200">
              Notifications
            </p>
            <button
              type="button"
              className="text-white text-xs rounded p-1 px-2 bg-orange-theme "
            >
              {" "}
              5 New
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsClicked({ ...initialState, notification: false })}
            className="text-2xl p-3 hover:drop-shadow-xl hover:bg-light-gray rounded-full"
            style={{ color: "rgb(153, 171, 180)" }}
          >
            <MdOutlineCancel />
          </button>
        </div>
        <div className="mt-5 ">
          <div className="flex items-center leading-8 gap-5 border-b-1 border-color p-3">
            <div className="rounded-full h-10 w-10 bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <div>
              <p className="font-semibold dark:text-gray-200">New notification</p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                You have a new message
              </p>
            </div>
          </div>
          <div className="mt-5">
            <button
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => { }}
            >
              See all notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
