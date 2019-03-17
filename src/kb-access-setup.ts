import { Answers, InputStreamOption, Question, Questions, prompt } from 'inquirer';
import { isFunction } from 'lodash';
import pify from 'pify';
import { } from 'travis-ci';

// This setup should handle (and ask for):
// - People with access to logs
//   - Organization or team (array of github users)?
//   - if Organization, which team inside the organization?
// - Create a GitHub oAuth application under the user OR organization for logs
// - make sure .dotenv files are `.gitignor`-ed
// - Set everything in a `.dotenv` file for logs to access locally (should ask user first)
// - Set everything up in travis (like semantic release does)

const defineUsersOrOrganization: Question<Answers> = {
  message: 'Should these logs be accessed by a GitHub Organization or a should define individual GitHub Users?',
  name: 'processType',
  type: 'list',
  choices: [ 'GitHub Organization', 'Define Team Now' ]
};

const organizationQuestion: Question<Answers> = {
  message: 'Enter a name of a github organization',
  name: 'organizationName',
  type: 'input'
};

const teamQuestion: Question<Answers> = {
  message: 'Enter GitHub usernames separated by spaces',
  name: 'teamMemberUsernames',
  type: 'input'
};

export const askForProcessType: Question[] = [
  defineUsersOrOrganization
];

export const askForOrganization: Question[] = [
  organizationQuestion,
];

export const askForTeam: Question[] = [
  teamQuestion,
];

export function defineLogsAccessTeam(): Promise<Answers> {
  let isOrganization: boolean;
  return prompt(askForProcessType)
    .then((answers: Answers) => isOrganization = answers.processType === 'GitHub Organization')
    .then(() => prompt(isOrganization ? askForOrganization : askForTeam));
}

class CliTool {
  private promptFn: (() => Promise<Answers>) | undefined;
  private questions: Question[] = [];
  constructor(option: (() => Promise<Answers>) | Question[]) {
    console.log('Constructing CliTool Instance');

    if (isFunction(option)) {
      this.promptFn = option;
    } else {
      this.questions = option;
    }


  }

  public run() {
    console.log('CliTool Instance Started');
    const questionAsked = this.promptFn ? this.promptFn() : prompt(this.questions);

    questionAsked.then((answers: Answers) => {
      console.log(answers);
    });

  }
}

const cliTool = new CliTool(defineLogsAccessTeam);

cliTool.run();
