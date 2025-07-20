export class IModel {
  /**
   * Model find method that overrieds the IQuery find method
   * @returns empty array
   */
  find() {
    console.log('finding with update for browser IModel...');
    return [];
  }
}
