import { Meteor } from 'meteor/meteor';
import UserSettings from '/imports/api/users-settings';
import Logger from '/imports/startup/server/logger';
import AuthTokenValidation, { ValidationStates } from '/imports/api/auth-token-validation';
import User from '/imports/api/users';

const otherUsersExportSettings = [
  'bbb_magic_cap_user',
  'bbb_magic_cap_user_visible_for_moderator',
  'bbb_magic_cap_user_visible_for_herself',
];

// eslint-disable-next-line consistent-return
function userSettings() {
  const tokenValidation = AuthTokenValidation.findOne({ connectionId: this.connection.id });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn(`Publishing UserSettings was requested by unauth connection ${this.connection.id}`);
    return UserSettings.find({ meetingId: '' });
  }

  const { meetingId, userId } = tokenValidation;

  const currentUser = User.findOne({ meetingId, userId });

  if (currentUser && currentUser.breakoutProps.isBreakoutUser) {
    const { parentId } = currentUser.breakoutProps;

    const [externalId] = currentUser.extId.split('-');

    const mainRoomUserSettings = UserSettings.find({ meetingId: parentId, userId: externalId });

    mainRoomUserSettings.map(({ setting, value }) => ({
      meetingId,
      setting,
      userId,
      value,
    })).forEach((doc) => {
      const selector = {
        meetingId,
        setting: doc.setting,
        userId,
      };

      UserSettings.upsert(selector, doc);
    });
  }

  function isOtherUsersExportSetting(uSetting) {
    return uSetting.userId !== userId
        && otherUsersExportSettings.includes(uSetting.setting);
  }

  function transformUserSetting(uSetting) {
    return {
      meetingId,
      userId: uSetting.userId,
      setting: uSetting.setting,
      value: uSetting.value,
    };
  }

  const self = this;

  const observer = UserSettings.find({ meetingId }).observe({
    added(uSetting) {
      if (isOtherUsersExportSetting(uSetting)) {
        self.added('users-settings', uSetting._id, transformUserSetting(uSetting));
      }
    },
    // eslint-disable-next-line no-unused-vars
    changed(newUSetting, oldUSetting) {
      if (isOtherUsersExportSetting(oldUSetting)) {
        self.changed('users-settings', oldUSetting._id, transformUserSetting(newUSetting));
      }
    },
    removed(uSetting) {
      if (isOtherUsersExportSetting(uSetting)) {
        self.removed('users-settings', uSetting._id);
      }
    },
  });

  self.onStop(() => {
    observer.stop();
  });

  self.ready();

  Logger.debug('Publishing UserSettings', { meetingId, userId });

  return UserSettings.find({ meetingId, userId });
}

function publish(...args) {
  const boundUserSettings = userSettings.bind(this);
  return boundUserSettings(...args);
}

Meteor.publish('users-settings', publish);
