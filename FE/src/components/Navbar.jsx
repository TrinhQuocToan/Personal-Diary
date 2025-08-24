import React, { useEffect, useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { FiShoppingCart } from "react-icons/fi";
import { BsChatLeft } from "react-icons/bs";
import { RiNotification3Line } from "react-icons/ri";
import { MdKeyboardArrowDown } from "react-icons/md";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";

import avatarPlaceholder from "../data/avatar.jpg";
import { Cart, Chat, Notification, UserProfile } from ".";
import { useStateContext } from "../contexts/ContextProvider";
import axiosInstance from "../pages/Authentication/helper/axiosInstance";

const NavButton = ({ title, customFunc, icon, color, dotColor }) => (
  <TooltipComponent content={title} position="BottomCenter">
    <button
      type="button"
      onClick={() => customFunc()}
      style={{ color }}
      className="relative text-xl rounded-full p-3 hover:bg-light-gray"
    >
      <span
        style={{ background: dotColor }}
        className="absolute inline-flex rounded-full h-2 w-2 right-2 top-2"
      />
      {icon}
    </button>
  </TooltipComponent>
);

const Navbar = () => {
  const {
    currentColor,
    activeMenu,
    setActiveMenu,
    handleClick,
    isClicked,
    setScreenSize,
    screenSize,
  } = useStateContext();

  const [avatarSrc, setAvatarSrc] = useState(avatarPlaceholder);
  const [loadingAvatar, setLoadingAvatar] = useState(true);

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (screenSize <= 900) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize]);

  const handleActiveMenu = () => setActiveMenu(!activeMenu);

  // --- New effect: fetch current user's avatar like UserProfile does ---
  useEffect(() => {
    let isMounted = true;

    const fetchAvatar = async () => {
      try {
        setLoadingAvatar(true);
        const response = await axiosInstance.get("/api/user/jwt-current");
        const serverAvatar = response?.data?.avatar;

        if (!isMounted) return;

        if (serverAvatar) {
          // Prefer absolute URL from server if provided; else prefix with axios baseURL or fallback host
          const isAbsolute = /^https?:\/\//i.test(serverAvatar);
          const baseUrl =
            axiosInstance?.defaults?.baseURL || "http://localhost:9999";
          const fullAvatar = isAbsolute
            ? serverAvatar
            : `${baseUrl}${serverAvatar}`;

          setAvatarSrc(fullAvatar);
        } else {
          setAvatarSrc(avatarPlaceholder);
        }
      } catch (err) {
        console.error("Navbar: error fetching avatar", err?.response || err);
        // keep placeholder on error
        setAvatarSrc(avatarPlaceholder);
      } finally {
        if (isMounted) setLoadingAvatar(false);
      }
    };

    fetchAvatar();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex justify-between p-2 md:ml-6 md:mr-6 relative">
      <NavButton
        title="Menu"
        customFunc={handleActiveMenu}
        color={currentColor}
        icon={<AiOutlineMenu />}
      />
      <div className="flex">
        {/* Uncomment if needed */}
        {/* <NavButton
          title="Cart"
          customFunc={() => handleClick("cart")}
          color={currentColor}
          icon={<FiShoppingCart />}
        />
        <NavButton
          title="Chat"
          dotColor="#03C9D7"
          customFunc={() => handleClick("chat")}
          color={currentColor}
          icon={<BsChatLeft />}
        />
        <NavButton
          title="Notification"
          dotColor="rgb(254, 201, 15)"
          customFunc={() => handleClick("notification")}
          color={currentColor}
          icon={<RiNotification3Line />}
        /> */}
        <TooltipComponent content="Profile" position="BottomCenter">
          <div
            className="flex items-center gap-2 cursor-pointer p-1 hover:bg-light-gray rounded-lg"
            onClick={() => handleClick("userProfile")}
          >
            <img
              className="rounded-full w-8 h-8 object-cover"
              src={avatarSrc}
              alt="user-profile"
            />
            <MdKeyboardArrowDown className="text-gray-400 text-14" />
          </div>
        </TooltipComponent>

        {isClicked.cart && <Cart />}
        {isClicked.chat && <Chat />}
        {isClicked.notification && <Notification />}
        {isClicked.userProfile && <UserProfile />}
      </div>
    </div>
  );
};

export default Navbar;
