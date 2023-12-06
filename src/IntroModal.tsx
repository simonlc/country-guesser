import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Dialog } from '@reach/dialog';

export const IntroModal = NiceModal.create(({ onStart }) => {
  const modal = useModal();

  function startGame() {
    onStart();
    modal.hide();
  }

  return (
    <Dialog isOpen={modal.visible} onDismiss={modal.hide}>
      <div className="modal modal--intro">
        <h1>Country Guesser</h1>
        <h2>How to play</h2>
        <p>Type the name of the country highlighted.</p>
        <button type="button" onClick={startGame}>
          Start
        </button>
      </div>
    </Dialog>
  );
});
