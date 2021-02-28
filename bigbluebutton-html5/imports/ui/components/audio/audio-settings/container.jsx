import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withModalMounter } from '/imports/ui/components/modal/service';
import browser from 'browser-detect';
import getFromUserSettings from '/imports/ui/services/users-settings';
import AudioModal from './component';
import Meetings from '/imports/api/meetings';
import Auth from '/imports/ui/services/auth';
import deviceInfo from '/imports/utils/deviceInfo';
import lockContextContainer from '/imports/ui/components/lock-viewers/context/container';
import AudioError from '/imports/ui/services/audio-manager/error-codes';
import Service from '../service';
import { AudioSettingsModal } from "./component";
import Settings from "../../../services/settings";


const AudioSettingsContainer = props => <AudioSettingsModal {...props} />;

const APP_CONFIG = Meteor.settings.public.app;

const skipCheck = getFromUserSettings('bbb_skip_check_audio', APP_CONFIG.skipCheck);

const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

export default lockContextContainer(withModalMounter(withTracker(({ mountModal, userLocks }) => {

  return ({
    closeModal: () => {
      if (!Service.isConnecting()) mountModal(null);
    },
    changeInputDevice: (inputDeviceId) => {
      const { microphoneConstraints } = Settings.application;
      let previousInputDeviceId = Service.inputDeviceId();
      Service.changeInputDevice(inputDeviceId).then(() => {
        if (!Service.isListenOnly()) {
          /*const call = new Promise((resolve, reject) => {
            if (skipCheck) {
              resolve(Service.joinMicrophone());
            } else {
              resolve(Service.transferCall());
            }
            reject(() => {
              Service.changeInputDevice(previousInputDeviceId).catch(() => Service.exitAudio());
            });
          });

          return call.then(() => {
            return true;
          }).catch((error) => {
            throw error;
          });
        }*/
           return Service.exitAudio()
                         .then(() => Service.updateAudioConstraints(Settings.application.microphoneConstraints)
                                            .then(() => Service.joinMicrophone()));
        }
        return Promise.resolve(inputDeviceId);
      });
    },
    changeOutputDevice: outputDeviceId => Service.changeOutputDevice(outputDeviceId),
    joinEchoTest: () => Service.joinEchoTest(),
    exitAudio: () => Service.exitAudio(),
    isConnecting: Service.isConnecting(),
    isConnected: Service.isConnected(),
    isEchoTest: Service.isEchoTest(),
    inputDeviceId: Service.inputDeviceId(),
    outputDeviceId: Service.outputDeviceId(),
    showPermissionsOvelay: Service.isWaitingPermissions(),
    audioLocked: userLocks.userMic,
    isIOSChrome: browser().name === 'crios',
    isMobileNative: navigator.userAgent.toLowerCase().includes('bbbnative'),
    isIEOrEdge: browser().name === 'edge' || browser().name === 'ie',
    hasMediaDevices: deviceInfo.hasMediaDevices,
    autoplayBlocked: Service.autoplayBlocked(),
    handleAllowAutoplay: () => Service.handleAllowAutoplay(),
    isRTL,
    AudioError,
    handleBack: () => {
      if (!Service.isConnecting()) mountModal(null);
    },
    handleRetry: () => true,
  });
})(AudioSettingsContainer)));
