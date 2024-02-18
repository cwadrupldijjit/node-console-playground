export class RegisterComponent extends HTMLElement {
    #template = `
        <form>
            <label class="display-block">
                <p class="label-like">Username</p>
                <input name="username" required>
            </label>
            
            <label class="display-block">
                <p class="label-like">Game Code</p>
                <input name="game-code" required>
            </label>
            
            <button>Submit</button>
        </form>
    `;
    
    #styles = `
        register-component {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        register-component form {
            padding: 32px;
        }
        
        register-component form[disabled] {
            pointer-events: none;
        }
    `;
    #submissionInProgress = false;
    
    constructor() {
        super();
        
        const shadow = this.attachShadow({ mode: 'open' });
        
        shadow.innerHTML = this.#template;
        
        const styles = document.createElement('style');
        styles.innerHTML = this.#styles;
        shadow.append(styles);
        
        shadow.querySelector('form').addEventListener('submit', (event) => {
            event.preventDefault();
            
            this.#submit();
        });
    }
    
    async #submit() {
        if (this.#submissionInProgress) return;
        
        this.#submissionInProgress = true;
        
        const form = this.querySelector('form');
        
        form.setAttribute('disabled', 'true');
        
        const response = await fetch('/game/player', { method: 'POST', body: JSON.stringify({ username: form.username, gameCode: form['game-code'] }) });
        
        if (response.status >= 400) {
            const error = await response.json();
            
            alert(error.message);
            
            this.#submissionInProgress = false;
            form.removeAttribute('disabled');
            
            return;
        }
        
        const payload = await response.json();
        
        this.dispatchEvent(new Event('user', { data: payload }));
    }
}

customElements.define('register-component', RegisterComponent);
