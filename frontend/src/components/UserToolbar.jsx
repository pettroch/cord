import React from "react";
import {
  FaVolumeUp,
  FaVolumeMute,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";

const UserControls = ({
  user,
  userSettings,
  toggleMute,
  toggleMuteAll,
  toggleMicrophoneMute,
  handleVolumeChange,
}) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Иконка звука / мьют */}
      {user === "me" ? (
        <div className="flex items-center space-x-2">
          {/* Иконка микрофона для самого себя */}
          <span
            onClick={() => toggleMicrophoneMute(user)}
            className="cursor-pointer text-gray-500"
          >
            {userSettings[user]?.isMicrophoneMuted ? (
              <FaMicrophoneSlash />
            ) : (
              <FaMicrophone />
            )}
          </span>

          {/* Иконка звука для самого себя */}
          <span
            onClick={() => toggleMuteAll(user)}
            className="cursor-pointer text-gray-500"
          >
            {userSettings[user]?.isMutedAll ? <FaVolumeMute /> : <FaVolumeUp />}
          </span>
        </div>
      ) : (
        // Иконка звука для других пользователей
        <span
          onClick={() => toggleMute(user)}
          className="cursor-pointer text-gray-500"
        >
          {userSettings[user]?.isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </span>
      )}

      {/* Шкала громкости для других пользователей */}
      {user !== "me" && (
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="100"
            value={userSettings[user]?.volume || 50}
            onChange={(e) => handleVolumeChange(user, e)}
            className="w-20 h-1 bg-gray-300 rounded-full cursor-pointer transition-all duration-300 transform hover:scale-105"
          />
          <span className="text-gray-500">
            {userSettings[user]?.volume || 50}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserControls;
