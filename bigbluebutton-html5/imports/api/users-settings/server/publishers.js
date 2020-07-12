import { Meteor } from 'meteor/meteor';
import UserSettings from '/imports/api/users-settings';
import Logger from '/imports/startup/server/logger';
import { extractCredentials } from '/imports/api/common/server/helpers';
import User from '/imports/api/users';

const otherUsersExportSettings = [
  'bbb_magic_cap_user',
  'bbb_magic_cap_user_visible_for_moderator',
  'bbb_magic_cap_user_visible_for_herself',
];

// eslint-disable-next-line consistent-return
function userSettings() {
  if (!this.userId) {
    return UserSettings.find({ meetingId: '' });
  }
  const { meetingId, requesterUserId } = extractCredentials(this.userId);

  const currentUser = User.findOne({ userId: requesterUserId });

  if (currentUser && currentUser.breakoutProps.isBreakoutUser) {
    const { parentId } = currentUser.breakoutProps;

    const [externalId] = currentUser.extId.split('-');

    const mainRoomUserSettings = UserSettings.find({ meetingId: parentId });

    mainRoomUserSettings.map(({ setting, value, userId }) => ({
      meetingId,
      setting,
      userId: User.findOne({ userId }).extId.split('-')[0],
      value,
    })).forEach((doc) => {
      if (doc.setting === 'bbb_magic_cap_user_visible_for_moderator') {
        // eslint-disable-next-line no-param-reassign
        doc.value = false;
      }
      const selector = {
        meetingId,
        userId: doc.userId,
        setting: doc.setting,
      };

      UserSettings.upsert(selector, doc);
    });
  }

  Logger.debug(`Publishing user settings for user=${requesterUserId}`);

  function transformUserSetting(uSetting) {
    if (uSetting.userId === requesterUserId) {
      return uSetting;
    }
    return {
      meetingId,
      userId: uSetting.userId,
      setting: uSetting.setting,
      value: otherUsersExportSettings.includes(uSetting.setting) ? uSetting.value : undefined,
    };
  }

  const self = this;

  const observer = UserSettings.find({ meetingId }).observe({
    added(document) {
      self.added('users-settings', document._id, transformUserSetting(document));
    },
    // eslint-disable-next-line no-unused-vars
    changed(newDocument, oldDocument) {
      self.changed('users-settings', newDocument._id, transformUserSetting(newDocument));
    },
    removed(oldDocument) {
      self.removed('users-settings', oldDocument._id);
    },
  });

  self.onStop(() => {
    observer.stop();
  });

  self.ready();
}

function publish(...args) {
  const boundUserSettings = userSettings.bind(this);
  return boundUserSettings(...args);
}

Meteor.publish('users-settings', publish);
