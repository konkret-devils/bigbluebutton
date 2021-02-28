import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withModalMounter } from '/imports/ui/components/modal/service';
import browser from 'browser-detect';
import deviceInfo from '/imports/utils/deviceInfo';
import lockContextContainer from '/imports/ui/components/lock-viewers/context/container';
import AudioError from '/imports/ui/services/audio-manager/error-codes';
import Service from '../service';
import AudioSettingsRoomModal from "./component";
import Settings from "../../../services/settings";


const AudioSettingsRoomModalContainer = props => <AudioSettingsRoomModal {...props} />;

const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

export default lockContextContainer(withModalMounter(withTracker(({ mountModal, userLocks }) => {

  return ({
    closeModal: () => {
      if (!Service.isConnecting()) mountModal(null);
    },
    changeInputDevice: (inputDeviceId) => {
      Service.changeInputDevice(inputDeviceId).then(() => {
        if (!Service.isListenOnly()) {
           return Service.exitAudio()
                         .then(() => Service.updateAudioConstraints(Settings.application.microphoneConstraints)
                                            .then(() => Service.joinMicrophone()));
        }
        return Promise.resolve(inputDeviceId);
      });
    },
    changeOutputDevice: (outputDeviceId) => {
      return Service.changeOutputDevice(outputDeviceId)
    },
    exitAudio: () => Service.exitAudio(),
    isConnecting: Service.isConnecting(),
    isConnected: Service.isConnected(),
    inputDeviceId: Service.inputDeviceId(),
    outputDeviceId: Service.outputDeviceId(),
    showPermissionsOverlay: Service.isWaitingPermissions(),
    audioLocked: userLocks.userMic,
    isIOSChrome: browser().name === 'crios',
    isMobileNative: navigator.userAgent.toLowerCase().includes('bbbnative'),
    isIEOrEdge: browser().name === 'edge' || browser().name === 'ie',
    hasMediaDevices: deviceInfo.hasMediaDevices,
    autoplayBlocked: Service.autoplayBlocked(),
    handleAllowAutoplay: () => Service.handleAllowAutoplay(),
    isRTL,
    AudioError,
  });
})(AudioSettingsRoomModalContainer)));
