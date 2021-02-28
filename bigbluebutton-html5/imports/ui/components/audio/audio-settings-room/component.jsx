import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import Button from '/imports/ui/components/button/component';
import { withModalMounter } from '/imports/ui/components/modal/service';
import DeviceSelector from '/imports/ui/components/audio/device-selector/component';
import AudioTestContainer from '/imports/ui/components/audio/audio-test/container';
import cx from 'classnames';
import { styles } from './styles';
import PermissionsOverlay from "../permissions-overlay/component";
import Modal from "../../modal/simple/component";
import AudioStreamVolume from "../audio-stream-volume/component";

const propTypes = {
  intl: PropTypes.object.isRequired,
  changeInputDevice: PropTypes.func.isRequired,
  changeOutputDevice: PropTypes.func.isRequired,
  isConnecting: PropTypes.bool.isRequired,
  inputDeviceId: PropTypes.string.isRequired,
  outputDeviceId: PropTypes.string.isRequired,
};

const intlMessages = defineMessages({
  descriptionLabel: {
    id: 'app.audio.audioSettings.descriptionLabel',
    description: 'audio settings description label',
  },
  micSourceLabel: {
    id: 'app.audio.audioSettings.microphoneSourceLabel',
    description: 'Label for mic source',
  },
  speakerSourceLabel: {
    id: 'app.audio.audioSettings.speakerSourceLabel',
    description: 'Label for speaker source',
  },
  streamVolumeLabel: {
    id: 'app.audio.audioSettings.microphoneStreamLabel',
    description: 'Label for stream volume',
  },
  okLabel: {
    id: 'app.about.confirmLabel',
    description: 'OK button label'
  },
  ariaModalTitle: {
    id: 'app.audioModal.ariaTitle',
    description: 'aria label for modal title',
  },
  autoplayPromptTitle: {
    id: 'app.audioModal.autoplayBlockedDesc',
    description: 'Message for autoplay audio block',
  },
});

class AudioSettingsRoomModal extends React.Component {
  constructor(props) {
    super(props);

    const {
      inputDeviceId,
      outputDeviceId,
    } = props;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleOutputChange = this.handleOutputChange.bind(this);

    this.state = {
      inputDeviceId,
      outputDeviceId,
    };
  }

  handleInputChange(deviceId) {
    const {
      changeInputDevice,
    } = this.props;

    changeInputDevice(deviceId);
    this.setState({
      inputDeviceId: deviceId,
    });
  }

  handleOutputChange(deviceId) {
    const {
      changeOutputDevice,
    } = this.props;

    changeOutputDevice(deviceId);
    this.setState({
      outputDeviceId: deviceId,
    });
  }

  renderContent() {
    const {
      isConnecting,
      intl,
      closeModal,
    } = this.props;

    return (
      <div className={styles.formWrapper}>
        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.audioNote}>
              {intl.formatMessage(intlMessages.descriptionLabel)}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <div className={styles.formElement}>
                <label
                  htmlFor="inputDeviceSelector"
                  className={cx(styles.label, styles.labelSmall)}
                >
                  {intl.formatMessage(intlMessages.micSourceLabel)}
                  <DeviceSelector
                    id="inputDeviceSelector"
                    value={this.state.inputDeviceId}
                    className={styles.select}
                    kind="audioinput"
                    onChange={this.handleInputChange}
                  />
                </label>
              </div>
              <div className={cx(styles.col, styles.spacedLeft)}>
                <AudioStreamVolume
                  deviceId={this.state.inputDeviceId}
                />
              </div>
            </div>
            <div className={styles.col}>
              <div className={styles.formElement}>
                <label
                  htmlFor="outputDeviceSelector"
                  className={cx(styles.label, styles.labelSmall)}
                >
                  {intl.formatMessage(intlMessages.speakerSourceLabel)}
                  <DeviceSelector
                    id="outputDeviceSelector"
                    value={this.state.outputDeviceId}
                    className={styles.select}
                    kind="audiooutput"
                    onChange={this.handleOutputChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={cx(styles.col, styles.spacedLeft)}>
              <label
                htmlFor="audioTest"
                className={styles.labelSmall}
              >
                Test your speaker volume
                <AudioTestContainer id="audioTest" />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      intl,
      showPermissionsOverlay,
      isIOSChrome,
      closeModal,
      isIEOrEdge,
    } = this.props;

    return (
        <span>
        {showPermissionsOverlay ? <PermissionsOverlay closeModal={closeModal} /> : null}
          <Modal
              overlayClassName={styles.overlay}
              className={styles.modal}
              onRequestClose={closeModal}
              hideBorder
              contentLabel={intl.formatMessage(intlMessages.ariaModalTitle)}
          >
          {isIEOrEdge ? (
              <p className={cx(styles.text, styles.browserWarning)}>
                <FormattedMessage
                    id="app.audioModal.unsupportedBrowserLabel"
                    description="Warning when someone joins with a browser that isnt supported"
                    values={{
                      0: <a href="https://www.google.com/chrome/">Chrome</a>,
                      1: <a href="https://getfirefox.com">Firefox</a>,
                    }}
                />
              </p>
          ) : null}
              <div className={styles.content}>
                {this.renderContent()}
              </div>
        </Modal>
      </span>
    );
  }

}

AudioSettingsRoomModal.propTypes = propTypes;

export default injectIntl(AudioSettingsRoomModal);
