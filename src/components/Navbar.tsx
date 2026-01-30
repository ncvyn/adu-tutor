export const Navbar = () => {
  return (
    <div class="navbar hidden xl:flex bg-base-300 shadow-sm">
      <div class="navbar-start">
        <a class="btn btn-ghost text-xl">AdU-Tutor</a>
      </div>
      <div class="navbar-center">
        <ul class="menu menu-horizontal">
          <li>
            <a>Messages</a>
          </li>
          <li>
            <a>Info Hub</a>
          </li>
        </ul>
      </div>
      <div class="navbar-end">
        <a class="btn">Profile</a>
      </div>
    </div>
  )
}
