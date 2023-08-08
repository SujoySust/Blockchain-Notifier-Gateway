import { notifierEnvActive } from '../../helpers/functions';
import { NetworkModel } from '../../models/db/network.model';
import { NotifierGatewayService } from './notifier.gateway.service';

export async function notifiers(networks: NetworkModel[]) {
  try {
    if (!notifierEnvActive()) return;

    global.reset_block = {};

    for (let i = 0; i < networks.length; i++) {
      const network = networks[i];
      const notifierService = new NotifierGatewayService();
      await notifierService.init(network);
      notifierService.startNotifier();
    }
  } catch (e) {
    console.error(e.stack);
  }
}
