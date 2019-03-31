import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lowerCase } from 'lodash';

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

  constructor(private http: HttpClient) { }

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
      });
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
