import _ from 'lodash';
import Users from '/imports/api/users';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import AuthTokenValidation, { ValidationStates } from '/imports/api/auth-token-validation';
import { extractCredentials } from '/imports/api/common/server/helpers';

const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

function currentUser() {
  if (!this.userId) {
    return Users.find({ meetingId: '' });
  }
  const { meetingId, requesterUserId } = extractCredentials(this.userId);

  check(meetingId, String);
  check(requesterUserId, String);

  const selector = {
    meetingId,
    userId: requesterUserId,
    intId: { $exists: true }
  };

  const options = {
    fields: {
      user: false,
      authToken: false, // Not asking for authToken from client side but also not exposing it
    },
  };

  return Users.find(selector, options);
}

function publishCurrentUser(...args) {
  const boundUsers = currentUser.bind(this);
  return boundUsers(...args);
}

Meteor.publish('current-user', publishCurrentUser);

// eslint-disable-next-line no-unused-vars
function users(role) {
  const tokenValidation = AuthTokenValidation.findOne({ connectionId: this.connection.id });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn(`Publishing Users was requested by unauth connection ${this.connection.id}`);
    return Users.find({ meetingId: '' });
  }

  if (!this.userId) {
    return Users.find({ meetingId: '' });
  }
  const { meetingId, userId } = tokenValidation;

  Logger.debug(`Publishing Users for ${meetingId} ${userId}`);

  const selector = {
    $or: [
      { meetingId },
    ],
    intId: { $exists: true }
  };

  // eslint-disable-next-line max-len
  const User = Users.findOne({ userId, meetingId },
    {
      fields: {
        role: 1,
        'breakoutProps.isBreakoutUser': 1,
        'breakoutProps.parentId': 1,
        extId: 1,
      },
    });

  if (!!User && User.role === ROLE_MODERATOR) {
    selector.$or.push({
      'breakoutProps.isBreakoutUser': true,
      'breakoutProps.parentId': meetingId,
    });
  }

  if (!!User && User.breakoutProps.isBreakoutUser) {
    selector.$or.push({
      meetingId: User.breakoutProps.parentId,
      userId: User.extId.split('-')[0],
    });
  }

  const options = {
    fields: {
      authToken: false,
    },
  };

  Logger.debug('Publishing Users', { meetingId, userId });

  return Users.find(selector, options);
}

function publish(...args) {
  const boundUsers = users.bind(this);
  return boundUsers(...args);
}

Meteor.publish('users', publish);
