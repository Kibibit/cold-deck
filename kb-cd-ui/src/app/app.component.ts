import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { forEach, isString, lowerCase } from 'lodash';

interface KbUser {
  displayName: string;
  emails: string[];
  organizations: string[];
  username: string;
  avatar: string;
}

interface KbLog {
  message: string;
  level: string | { msg: string; colors: string };
  scope: string | { msg: string; colors: string };
  timestamp: string;
  tags?: string | { msg: string; colors: string };
  icon?: string;
}

interface KbLogs {
  logs: KbLog[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {
  title = 'kb-cd-ui';
  loggedInUser: KbUser;
  logs: KbLog[];

  constructor(private http: HttpClient, private sanitized: DomSanitizer) { }

  ngOnInit(): void {
    this.http.get<KbUser>('./user')
      .subscribe((user) => {
        this.loggedInUser = user;

        console.log(this.loggedInUser);
      });

    this.http.get<KbLogs>('./logs')
      .subscribe((logs) => {
        console.log('all logs!');
        console.log(logs);

        this.logs = logs.logs;

        forEach(this.logs, (log) => {
          const levelName = isString(log.level) ? log.level.toLowerCase() : log.level.msg.toLowerCase();
          if (levelName === 'info') {
            return log.icon = 'info';
          }

          if (levelName === 'warn') {
            return log.icon = 'warning';
          }

          if (levelName === 'error') {
            return log.icon = 'block';
          }

          log.icon = '';
        });
      });
  }

  getTagStyle(tag: string | { msg: string; colors: string }) {
    if (isString(tag)) { return ''; }

    let style = '';

    style += tag.colors.indexOf('bgYellow') > -1 ? 'background: hsl(48, 100%, 67%);' : '';
    style += tag.colors.indexOf('magenta') > -1 ? 'color: hsl(348, 100%, 61%);' : '';
    style += tag.colors.indexOf('red') > -1 ? 'color: hsl(348, 100%, 61%);' : '';
    style += tag.colors.indexOf('grey') > -1 ? 'color: hsl(0, 0%, 71%);' : '';
    style += tag.colors.indexOf('green') > -1 ? 'color: hsl(141, 71%, 48%);' : '';

    return this.sanitized.bypassSecurityTrustStyle(style);
  }

  getColor(logLevel?: string) {
    logLevel = lowerCase(logLevel);

    if (logLevel === 'info') {
      return 'hsl(204, 86%, 53%)';
    }

    if (logLevel === 'warn') {
      return 'hsl(48, 100%, 67%)';
    }

    if (logLevel === 'error') {
      return 'hsl(348, 100%, 61%)';
    }

    return 'transparent';
  }
}
