import { Meteor } from 'meteor/meteor';
import { LinksCollection } from '/imports/api/links';

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

Meteor.startup(async () => {
  console.log('[Startup] Meteor server is starting...');
  // If the Links collection is empty, add some data.
  const count = await LinksCollection.find().countAsync();
  console.log(`[Startup] LinksCollection count: ${count}`);
  if (count === 0) {
    await insertLink({
      title: 'Do the Tutorial',
      url: 'https://www.meteor.com/tutorials/react/creating-an-app',
    });
    await insertLink({
      title: 'Follow the Guide',
      url: 'https://guide.meteor.com',
    });
    await insertLink({
      title: 'Read the Docs',
      url: 'https://docs.meteor.com',
    });
    await insertLink({
      title: 'Discussions',
      url: 'https://forums.meteor.com',
    });
    console.log('[Startup] Initial links inserted.');
  }

  Meteor.publish("links", function () {
    console.log('[Publish] links publication requested');
    return LinksCollection.find();
  });

  // Inicia o Change Stream após o Meteor estar pronto e conectado ao banco
  try {
    console.log('[ChangeStream] Tentando iniciar Change Stream...');
    const changeStream = LinksCollection.watchChangeStream([
      { $match: { operationType: 'insert' } }
    ]);
    console.log('[ChangeStream] Change Stream iniciado:', !!changeStream);
    changeStream.on('change', (change) => {
      console.log('[ChangeStream] Evento detectado:', JSON.stringify(change, null, 2));
    });
    changeStream.on('error', (err) => {
      console.error('[ChangeStream] Erro:', err);
    });
    changeStream.on('close', () => {
      console.log('[ChangeStream] Fechado');
    });
    changeStream.on('message', (message) => {
      console.log('[ChangeStream] Mensagem:', message);
    });
    console.log('[ChangeStream] Change Stream configurado com sucesso.');
  } catch (e) {
    console.error('[ChangeStream] Erro ao iniciar Change Stream:', e);
  }
});
