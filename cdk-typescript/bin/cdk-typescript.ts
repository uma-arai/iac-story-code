#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();

try{

    //new AppStack(app, 'AppStack');
} catch (e) {
    console.trace(e);
    throw e;
}

app.synth();
