#!/usr/bin/env node

import { RPC } from 'basketry';
import generator from '.';

new RPC({ generator }).execute();
