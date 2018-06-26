Typescript Express starter
---
Typescript express starter is focused on RESTful API server.

## server
```bash
DEBUG=tse:* PORT=12345 nodemon --watch 'src/**/*.ts' --exec 'ts-node' ./src/app.ts
```

## debug
```bash
DEBUG=tse:* PORT=12345 node -r ts-node/register --inspect-brk=9229 --nolazy ./src/app.ts
```
